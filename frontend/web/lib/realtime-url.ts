const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1'])

function isLocalHostname(hostname: string): boolean {
  return LOCAL_HOSTNAMES.has(hostname) || hostname.endsWith('.localhost')
}

export function resolveWebSocketBaseUrl(backendUrl: string): string {
  const rawUrl = backendUrl.trim()

  if (!rawUrl) {
    throw new Error('WebSocket backend URL is empty.')
  }

  try {
    const url = new URL(rawUrl)

    if (isLocalHostname(url.hostname)) {
      url.protocol = 'ws:'
      return url.toString().replace(/\/$/, '')
    }

    if (url.protocol === 'https:') {
      url.protocol = 'wss:'
    } else if (url.protocol === 'http:') {
      url.protocol = 'ws:'
    }

    return url.toString().replace(/\/$/, '')
  } catch {
    return rawUrl
      .replace(/^https:/i, 'wss:')
      .replace(/^http:/i, 'ws:')
      .replace(/\/$/, '')
  }
}