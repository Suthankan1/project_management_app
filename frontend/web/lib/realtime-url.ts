const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1'])

function isLocalHostname(hostname: string): boolean {
  return LOCAL_HOSTNAMES.has(hostname) || hostname.endsWith('.localhost')
}

/**
 * Resolves the WebSocket base URL for STOMP notifications and chat sync.
 * 
 * In production, it requires NEXT_PUBLIC_WS_BASE_URL to be set to the backend's direct
 * absolute URL (e.g. 'https://api.planora.com') and converts it to 'wss://api.planora.com'.
 * If the variable is missing in production runtime, it throws a hard-fail runtime error.
 * 
 * In development or during Next build phase, if NEXT_PUBLIC_WS_BASE_URL is missing,
 * it falls back to the backend URL passed in (or 'http://localhost:8080' if empty),
 * converting it to a local 'ws://' endpoint.
 */
export function resolveWebSocketBaseUrl(backendUrl: string): string {
  let wsUrl = process.env.NEXT_PUBLIC_WS_BASE_URL;

  if (!wsUrl) {
    const isProdRuntime = process.env.NODE_ENV === 'production';
    const isNextProductionBuild = process.env.NEXT_PHASE === 'phase-production-build';

    if (isProdRuntime && !isNextProductionBuild) {
      throw new Error('NEXT_PUBLIC_WS_BASE_URL environment variable is missing.');
    }
    
    // In development or during production build phase, fallback to backendUrl or localhost
    wsUrl = backendUrl || 'http://localhost:8080';
  }

  const rawUrl = wsUrl.trim();

  if (!rawUrl) {
    throw new Error('WebSocket backend URL is empty.');
  }

  try {
    const url = new URL(rawUrl);

    if (isLocalHostname(url.hostname)) {
      url.protocol = 'ws:';
      return url.toString().replace(/\/$/, '');
    }

    if (url.protocol === 'https:') {
      url.protocol = 'wss:';
    } else if (url.protocol === 'http:') {
      url.protocol = 'ws:';
    }

    return url.toString().replace(/\/$/, '');
  } catch {
    return rawUrl
      .replace(/^https:/i, 'wss:')
      .replace(/^http:/i, 'ws:')
      .replace(/\/$/, '');
  }
}