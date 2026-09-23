/* eslint-disable unicorn/prefer-global-this */

export function getAppBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return process.env['VERCEL_URL'] !== undefined && process.env['VERCEL_URL'] !== ''
    ? `https://${process.env['VERCEL_URL']}`
    : `http://localhost:${process.env['PORT'] ?? 3000}`;
}
