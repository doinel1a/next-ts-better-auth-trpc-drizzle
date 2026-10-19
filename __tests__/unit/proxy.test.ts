import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { config, proxy } from '@/proxy';

const origin = 'http://localhost:3000';

function createRequest(path: string, cookie?: string) {
  return new NextRequest(
    `${origin}${path}`,
    cookie === undefined ? undefined : { headers: { cookie } }
  );
}

function isMatched(path: string) {
  return unstable_doesMiddlewareMatch({ config, url: `${origin}${path}` });
}

describe('proxy', () => {
  describe('public routes', () => {
    it.each([
      ['sign-in', '/auth/sign-in'],
      ['sign-up', '/auth/sign-up']
    ])('lets an anonymous visitor through to %s', (_label, path) => {
      const response = proxy(createRequest(path));

      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });

    it.each([
      ['sign-in', '/auth/sign-in?redirect_url=%2Fdashboard'],
      ['sign-up', '/auth/sign-up?x=1']
    ])('ignores the search when matching %s', (_label, path) => {
      const response = proxy(createRequest(path));

      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });

    it.each([
      ['a sub-path of sign-in', '/auth/sign-in/extra', '%2Fauth%2Fsign-in%2Fextra'],
      ['a different casing of sign-in', '/Auth/Sign-In', '%2FAuth%2FSign-In']
    ])('does not treat %s as public', (_label, path, encoded) => {
      const response = proxy(createRequest(path));

      expect(response.headers.get('location')).toBe(
        `${origin}/auth/sign-in?redirect_url=${encoded}`
      );
    });
  });

  describe('protected routes without a session cookie', () => {
    it.each([
      ['the root', '/', '%2F'],
      ['a plain path', '/dashboard', '%2Fdashboard'],
      ['a nested path', '/settings/profile', '%2Fsettings%2Fprofile'],
      ['a path with a search', '/dashboard?tab=1&sort=asc', '%2Fdashboard%3Ftab%3D1%26sort%3Dasc'],
      ['a path with an encoded character', '/a%20b', '%2Fa%2520b']
    ])(
      'redirects %s to sign-in, remembering where the visitor was going',
      (_label, path, encoded) => {
        const response = proxy(createRequest(path));

        expect(response.status).toBe(307);
        expect(response.headers.get('location')).toBe(
          `${origin}/auth/sign-in?redirect_url=${encoded}`
        );
      }
    );

    it.each([
      [
        'a repeated and plus-encoded search',
        '/dashboard?a=1&a=2&b=c+d',
        '%2Fdashboard%3Fa%3D1%26a%3D2%26b%3Dc%2Bd'
      ],
      ['a non-ASCII path', '/café', '%2Fcaf%25C3%25A9'],
      ['a protocol-relative path, kept as an opaque value', '//evil.com', '%2F%2Fevil.com']
    ])('redirects %s without altering it', (_label, path, encoded) => {
      const response = proxy(createRequest(path));

      expect(response.headers.get('location')).toBe(
        `${origin}/auth/sign-in?redirect_url=${encoded}`
      );
    });

    it.each([
      ['only the session cache cookie', 'better-auth.session_data=abc'],
      ['a session cookie without the better-auth prefix', 'session_token=abc']
    ])('redirects with %s', (_label, cookie) => {
      const response = proxy(createRequest('/dashboard', cookie));

      expect(response.headers.get('location')).toBe(
        `${origin}/auth/sign-in?redirect_url=%2Fdashboard`
      );
    });

    it('redirects when the only cookies are unrelated to the session', () => {
      const response = proxy(createRequest('/dashboard', 'theme=dark; foo=bar'));

      expect(response.headers.get('location')).toBe(
        `${origin}/auth/sign-in?redirect_url=%2Fdashboard`
      );
    });

    it('redirects when the session cookie is empty', () => {
      const response = proxy(createRequest('/dashboard', 'better-auth.session_token='));

      expect(response.headers.get('location')).toBe(
        `${origin}/auth/sign-in?redirect_url=%2Fdashboard`
      );
    });
  });

  describe('protected routes with a session cookie', () => {
    it.each([
      ['the default cookie', 'better-auth.session_token=abc'],
      ['the secure-prefixed cookie', '__Secure-better-auth.session_token=abc'],
      ['the cookie among unrelated ones', 'theme=dark; better-auth.session_token=abc; foo=bar'],
      ['the dash-separated cookie name', 'better-auth-session_token=abc'],
      ['the secure dash-separated cookie name', '__Secure-better-auth-session_token=abc'],
      [
        'the session cookie next to the session cache cookie',
        'better-auth.session_token=abc; better-auth.session_data=xyz'
      ]
    ])('lets the visitor through with %s', (_label, cookie) => {
      const response = proxy(createRequest('/dashboard', cookie));

      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });

    // The proxy only checks that the cookie exists; validating it is left to `getSession` in the pages
    it('does not validate the cookie value', () => {
      const response = proxy(
        createRequest('/dashboard', 'better-auth.session_token=not-a-real-token')
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });

    it('does not redirect an authenticated visitor away from the auth pages', () => {
      const response = proxy(createRequest('/auth/sign-in', 'better-auth.session_token=abc'));

      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });
  });
});

describe('config.matcher', () => {
  describe('pages the proxy protects', () => {
    it.each([
      ['the root', '/'],
      ['a plain page', '/dashboard'],
      ['a nested page', '/settings/profile'],
      ['the sign-in page', '/auth/sign-in'],
      ['a page with a search', '/dashboard?tab=1'],
      ['a dot in a parent segment only', '/dashboard.v2/page'],
      ['a search that looks like a file name', '/dashboard?file=a.png']
    ])('runs on %s', (_label, path) => {
      expect(isMatched(path)).toBe(true);
    });
  });

  describe('paths the proxy skips', () => {
    it.each([
      ['Next.js static assets', '/_next/static/chunks/main.js'],
      ['Next.js image optimization', '/_next/image'],
      ['the API root', '/api'],
      ['the auth API', '/api/auth/sign-in/email'],
      ['a versioned API route', '/api/v1/test'],
      ['an image from public/', '/logo.png'],
      ['a nested file from public/', '/images/team/photo.webp'],
      ['the favicon', '/favicon.svg'],
      ['robots.txt', '/robots.txt'],
      ['the web manifest', '/app.webmanifest'],
      ['a file inside a dot directory', '/.well-known/security.txt'],
      ['a file with an uppercase extension', '/LOGO.PNG']
    ])('does not run on %s', (_label, path) => {
      expect(isMatched(path)).toBe(false);
    });
  });

  // Documented in `proxy.ts`: any last segment with a dot counts as a static file, so a dynamic page
  // like `/users/john.doe` is not covered by the proxy and has to check the session on its own
  describe('known limitation', () => {
    it('does not run on a page whose last segment contains a dot', () => {
      expect(isMatched('/users/john.doe')).toBe(false);
    });
  });

  // Only `/api` and `/api/...` are API routes, not any path that merely starts with "api"
  describe('paths that only look like skipped ones', () => {
    it.each([
      ['a page starting with "api"', '/api-docs'],
      ['a page starting with "api" and more letters', '/apixyz'],
      ['a page starting with "_next"', '/_nextjs-guide']
    ])('still runs on %s', (_label, path) => {
      expect(isMatched(path)).toBe(true);
    });
  });
});

async function loadProxyWithRoutes() {
  vi.stubEnv('NEXT_PUBLIC_SIGN_IN_URL', '/login');
  vi.stubEnv('NEXT_PUBLIC_SIGN_UP_URL', '/register');
  vi.resetModules();

  const { proxy: customProxy } = await import('@/proxy');
  return customProxy;
}

describe('proxy with custom auth routes', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it.each([
    ['sign-in', '/login'],
    ['sign-up', '/register']
  ])('lets an anonymous visitor through to the configured %s route', async (_label, path) => {
    const customProxy = await loadProxyWithRoutes();
    const response = customProxy(createRequest(path));

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('redirects to the configured sign-in route', async () => {
    const customProxy = await loadProxyWithRoutes();
    const response = customProxy(createRequest('/dashboard'));

    expect(response.headers.get('location')).toBe(`${origin}/login?redirect_url=%2Fdashboard`);
  });

  it('no longer treats the default auth routes as public', async () => {
    const customProxy = await loadProxyWithRoutes();
    const response = customProxy(createRequest('/auth/sign-in'));

    expect(response.headers.get('location')).toBe(`${origin}/login?redirect_url=%2Fauth%2Fsign-in`);
  });
});
