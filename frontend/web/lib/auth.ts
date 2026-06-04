import { initializeSessionCacheForCurrentAuth } from '@/lib/session-cache';
import { getApiBaseUrl } from '@/lib/api-base-url';

export interface User {
    email: string;
    username?: string;
    fullName?: string;
    userId?: number;
    exp?: number;
}

export const AUTH_TOKEN_CHANGED_EVENT = 'planora-auth-token-changed';

const TOKEN_KEY = 'planora:access_token';
const REFRESH_TOKEN_KEY = 'planora:refresh_token';

interface JwtPayload {
    sub?: string;
    username?: string;
    exp?: number;
}

let refreshAccessTokenPromise: Promise<string> | null = null;

function emitAuthTokenChanged(): void {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(AUTH_TOKEN_CHANGED_EVENT));
    }
}

// Remember-me helpers

/** Persist the user's "remember me" preference (stored in localStorage itself so
 *  it survives a browser restart and controls where the tokens are kept). */
export function setRememberMe(remember: boolean): void {
    if (typeof window === 'undefined') return;
    if (remember) {
        localStorage.setItem('rememberMe', 'true');
    } else {
        localStorage.removeItem('rememberMe');
    }
}

export function getRememberMe(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('rememberMe') === 'true';
}

/** Always use localStorage so auth tokens are shared across browser tabs.
 *  sessionStorage is tab-isolated, which causes new tabs to redirect to login.
 *  Both localStorage and sessionStorage are JS-accessible, so there is no
 *  meaningful security difference — HTTP-only cookies would be needed for that.
 *  The rememberMe flag is kept for UX preference tracking only. */
function tokenStorage(): Storage {
    return localStorage;
}

// Token helpers

export function getUserFromToken(): User | null {
    if (typeof window === 'undefined') return null;

    const token = localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token')
        || sessionStorage.getItem(TOKEN_KEY) || sessionStorage.getItem('token');
    if (!token) return null;

    try {
        const tokenParts = token.split('.');
        if (tokenParts.length < 2) {
            clearTokens();
            return null;
        }

        const base64Url = tokenParts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload: JwtPayload = JSON.parse(jsonPayload);
        if (!payload.sub) {
            clearTokens();
            return null;
        }

        if (payload.exp && payload.exp * 1000 <= Date.now()) {
            return null;
        }

        type ExtendedJwtPayload = JwtPayload & { userId?: number; id?: number };
        const extPayload = payload as ExtendedJwtPayload;
        let userId: number | undefined = undefined;
        if (extPayload.userId != null) userId = Number(extPayload.userId);
        else if (typeof extPayload.id === 'number') userId = extPayload.id;

        const decodedUser: User = {
            email: payload.sub,
            username: payload.username,
            userId,
            exp: payload.exp,
        };

        const cachedProfile = localStorage.getItem('userProfile');
        if (cachedProfile) {
            try {
                const parsedProfile = JSON.parse(cachedProfile) as User;
                if (parsedProfile.email?.toLowerCase() === decodedUser.email?.toLowerCase()) {
                    return {
                        ...decodedUser,
                        username: parsedProfile.username || decodedUser.username,
                        fullName: parsedProfile.fullName,
                    };
                }
            } catch {
                localStorage.removeItem('userProfile');
            }
        }

        return decodedUser;
    } catch {
        return null;
    }
}

export function getUserIdFromToken(): number | null {
    const user = getUserFromToken();
    return user?.userId ?? null;
}

export function saveToken(token: string): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        tokenStorage().setItem(TOKEN_KEY, token);
        initializeSessionCacheForCurrentAuth(token);
        emitAuthTokenChanged();
    }
}

export function saveRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('refreshToken');
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        sessionStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.setItem('planora:has_refresh_token', 'true');
    }
}

export function getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('planora:has_refresh_token') === 'true' ? 'true' : null;
}

export function clearTokens(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem('userProfile');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('planora:has_refresh_token');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(REFRESH_TOKEN_KEY);
        // Wipe all planora: prefixed data caches so the next user session
        // starts with a clean slate
        Object.keys(localStorage)
            .filter((k) => k.startsWith('planora:'))
            .forEach((k) => localStorage.removeItem(k));
        Object.keys(sessionStorage)
            .filter((k) => k.startsWith('planora:'))
            .forEach((k) => sessionStorage.removeItem(k));

        // Non-blocking logout call to clear HttpOnly cookie
        fetch(`${getApiBaseUrl()}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        }).catch((err) => console.error('Failed to logout backend session', err));

        emitAuthTokenChanged();
    }
}

/**
 * Returns the JWT token only if it's present and not expired.
 * Checks both storages to handle transitions between remember / no-remember sessions.
 */
export function getValidToken(): string | null {
    if (typeof window === 'undefined') return null;
    if (getUserFromToken()) {
        return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token')
            || sessionStorage.getItem(TOKEN_KEY) || sessionStorage.getItem('token');
    }
    return null;
}

/**
 * Uses native fetch (not axios) to avoid circular imports.
 * POSTs the current refresh token to /api/auth/refresh, stores the new
 * access token (and refresh token if rotated), and returns the new access token.
 * On failure it clears all tokens and throws.
 */
async function requestRefreshAccessToken(): Promise<string> {
    const rt = getRefreshToken();
    if (!rt) {
        clearTokens();
        throw new Error('No refresh token available');
    }
    const res = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });
    if (!res.ok) {
        clearTokens();
        throw new Error('Token refresh failed');
    }
    const data = await res.json();
    saveToken(data.token);
    saveRefreshToken('true');
    return data.token;
}

export function refreshAccessToken(): Promise<string> {
    if (!refreshAccessTokenPromise) {
        refreshAccessTokenPromise = requestRefreshAccessToken().finally(() => {
            refreshAccessTokenPromise = null;
        });
    }
    return refreshAccessTokenPromise;
}

/**
 * Returns a usable access token, refreshing it first when the short-lived token
 * has expired but the 30-day refresh token is still available.
 */
export async function ensureValidToken(): Promise<string | null> {
    const token = getValidToken();
    if (token) return token;

    if (!getRefreshToken()) return null;

    try {
        return await refreshAccessToken();
    } catch {
        return null;
    }
}

/** Alias for clearTokens — clears all auth state and planora: caches. */
export function logout(): void {
    clearTokens();
}
