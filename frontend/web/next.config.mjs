import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';

    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
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
