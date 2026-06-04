/**
 * Helper to retrieve the base URL of the Spring Boot backend API from environment variables.
 * 
 * In development, allows an empty string so requests fall back to the Next.js app origin
 * (useful if local requests are proxied or run directly on the same domain).
 * In production, throws a clear error if NEXT_PUBLIC_API_BASE_URL is missing
 * to fail startup/builds/execution early instead of failing silently.
 */
export function getApiBaseUrl(): string {
    const url = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!url) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('NEXT_PUBLIC_API_BASE_URL environment variable is missing.');
        }
        return '';
    }
    return url;
}
