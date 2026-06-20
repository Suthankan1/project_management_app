import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isProduction = process.env.NODE_ENV === 'production';
const localBackendOrigin = 'http://localhost:8080';
const localWebSocketOrigin = 'ws://localhost:8080';
const awsImageSource = 'https://*.amazonaws.com';

function originFromUrl(rawUrl) {
  if (!rawUrl) return null;

  try {
    return new URL(rawUrl).origin;
  } catch {
    return null;
  }
}

function websocketOriginFromUrl(rawUrl) {
  const origin = originFromUrl(rawUrl);
  if (!origin) return null;

  return origin
    .replace(/^https:/i, 'wss:')
    .replace(/^http:/i, 'ws:');
}

function uniqueSources(sources) {
  return sources.filter(Boolean).filter((source, index, all) => all.indexOf(source) === index);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';

    const proxy = (path) => ({
      source: `/api/${path}/:path*`,
      destination: `${backendUrl}/api/${path}/:path*`,
    });
    return [
      proxy('auth'),
      proxy('projects'),
      proxy('tasks'),
      proxy('sprints'),
      proxy('sprintboards'),
      proxy('burndown'),
      proxy('calendar'),
      proxy('kanban'),
      proxy('kanbans'),
      proxy('kanban-columns'),
      proxy('labels'),
      proxy('users'),
      proxy('teams'),
      proxy('notifications'),
      proxy('chat'),
      proxy('folders'),
      proxy('dms'),
      proxy('milestones'),
      proxy('user'),
      proxy('pages'),
      proxy('scheduled-reports'),
      proxy('reports'),
      proxy('search'),
      proxy('github'),
      proxy('portfolios'),
      proxy('dashboard'),
    ];
  },
  async headers() {
    const backendHost = process.env.NEXT_PUBLIC_BACKEND_HOST;
    const backendHostOrigin = backendHost ? `https://${backendHost}` : null;
    const publicApiOrigin = originFromUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
    const publicBackendOrigin = originFromUrl(process.env.NEXT_PUBLIC_BACKEND_URL);
    const rewriteBackendOrigin = originFromUrl(process.env.BACKEND_URL);
    const websocketOrigin = websocketOriginFromUrl(process.env.NEXT_PUBLIC_WS_BASE_URL);
    const localSources = isProduction ? [] : [localBackendOrigin];
    const localWebSocketSources = isProduction ? [] : [localWebSocketOrigin];

    const backendSources = uniqueSources([
      backendHostOrigin,
      publicApiOrigin,
      publicBackendOrigin,
      rewriteBackendOrigin,
      ...localSources,
    ]);
    const connectSources = uniqueSources([
      "'self'",
      ...backendSources,
      websocketOrigin,
      ...localWebSocketSources,
    ]);
    const imageSources = uniqueSources([
      "'self'",
      'data:',
      'blob:',
      awsImageSource,
      ...backendSources,
    ]);
    const frameSources = uniqueSources([
      "'self'",
      awsImageSource,
      'blob:',
      ...backendSources,
    ]);

    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src ${imageSources.join(' ')};
      connect-src ${connectSources.join(' ')};
      font-src 'self' data:;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      frame-src ${frameSources.join(' ')};
    `.replace(/\s{2,}/g, ' ').trim();

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      // AWS backend (App Runner / ECS ALB) — set NEXT_PUBLIC_BACKEND_HOST in Netlify env vars
      ...(process.env.NEXT_PUBLIC_BACKEND_HOST
        ? [{ protocol: 'https', hostname: process.env.NEXT_PUBLIC_BACKEND_HOST, port: '', pathname: '/**' }]
        : []),
    ],
  },
};

export default nextConfig;
