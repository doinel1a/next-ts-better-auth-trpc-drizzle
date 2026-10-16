/**
  Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
  This is especially useful for Docker builds.
*/
import type { NextConfig } from 'next';

import { env } from './src/env';

const developmentScriptSources = env.NODE_ENV === 'development' ? " 'unsafe-eval'" : '';

const contentSecurityPolicy = [
  "base-uri 'self'",
  "connect-src 'self'",
  "default-src 'self'",
  "font-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: blob:",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${developmentScriptSources}`,
  "style-src 'self' 'unsafe-inline'"
].join('; ');

const permissionsPolicy = [
  'accelerometer=()',
  'browsing-topics=()',
  'camera=()',
  'geolocation=()',
  'gyroscope=()',
  'magnetometer=()',
  'microphone=()',
  'payment=()',
  'usb=()'
].join(', ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'Permissions-Policy', value: permissionsPolicy },
  { key: 'Referrer-Policy', value: 'same-origin' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' }
];

const config = {
  reactStrictMode: true,
  reactCompiler: true,
  poweredByHeader: false,
  headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  }
} satisfies NextConfig;

export default config;
