import { describe, expect, it } from 'vitest';

import { buildAuthUrl, isValidRedirectUrl, resolveRedirectUrl } from '@/lib/utils/auth-redirect';

describe('isValidRedirectUrl', () => {
  describe('valid paths', () => {
    it.each([
      ['the root', '/'],
      ['a plain path', '/dashboard'],
      ['a nested path', '/settings/profile'],
      ['a path with search and hash', '/dashboard?tab=1#section'],
      ['encoded slashes, which stay inside the path', '/%2F%2Fevil.com']
    ])('accepts %s', (_label, url) => {
      expect(isValidRedirectUrl(url)).toBe(true);
    });
  });

  describe('missing or non-path values', () => {
    it.each([
      ['null', null],
      ['an empty string', ''],
      ['a bare host', 'evil.com'],
      ['a leading space', ' /dashboard']
    ])('rejects %s', (_label, url) => {
      expect(isValidRedirectUrl(url)).toBe(false);
    });
  });

  describe('other origins and schemes', () => {
    it.each([
      ['a protocol-relative URL', '//evil.com'],
      ['an absolute URL', 'https://evil.com'],
      ['a javascript: URL', 'javascript:alert(1)'],
      ['a data: URL', 'data:text/html,x'],
      ['a mailto: URL', 'mailto:a@b.c']
    ])('rejects %s', (_label, url) => {
      expect(isValidRedirectUrl(url)).toBe(false);
    });
  });

  describe('backslashes', () => {
    it.each([
      ['a backslash after the leading slash', String.raw`/\evil.com`],
      ['a backslash anywhere in the path', String.raw`/path\evil.com`],
      ['a backslash after a dot segment', String.raw`/./\evil.com`]
    ])('rejects %s', (_label, url) => {
      expect(isValidRedirectUrl(url)).toBe(false);
    });
  });

  describe('characters the URL parser strips', () => {
    it.each([
      ['a tab hidden inside the leading slashes', '/\t/evil.com'],
      ['a newline hidden inside the leading slashes', '/\n/evil.com'],
      ['a carriage return hidden inside the leading slashes', '/\r/evil.com']
    ])('rejects %s', (_label, url) => {
      expect(isValidRedirectUrl(url)).toBe(false);
    });
  });

  describe('paths that normalize to a protocol-relative URL', () => {
    it.each([
      ['an empty segment after a dot segment', '/.//evil.com'],
      ['a dot segment at the root', '/..//evil.com'],
      ['a nested dot segment', '/a/..//evil.com'],
      ['an encoded dot segment', '/%2e%2e//evil.com'],
      ['a nested encoded dot segment', '/a/%2e%2e//evil.com']
    ])('rejects %s', (_label, url) => {
      expect(isValidRedirectUrl(url)).toBe(false);
    });
  });

  // These look suspicious but stay on the same origin, so they must not be rejected
  describe('suspicious-looking paths that stay on the same origin', () => {
    it.each([
      ['an encoded backslash', '/%5Cevil.com'],
      ['dot segments climbing above the root', '/a/../../evil.com'],
      ['a non-breaking space between the slashes', '/\u{A0}/evil.com'],
      ['a line separator between the slashes', '/\u{2028}/evil.com'],
      ['a fullwidth slash', '/／evil.com'],
      ['an @ in the path', '/@evil.com'],
      ['a non-ASCII path', '/café'],
      ['a malformed percent escape', '/%'],
      ['only a search', '/?x=1'],
      ['only a hash', '/#a'],
      ['a very long path', `/${'a'.repeat(5000)}`]
    ])('accepts %s', (_label, url) => {
      expect(isValidRedirectUrl(url)).toBe(true);
    });
  });
});

describe('resolveRedirectUrl', () => {
  const fallback = '/home';

  describe('valid paths', () => {
    it('returns a valid path unchanged', () => {
      expect(resolveRedirectUrl('/dashboard', fallback)).toBe('/dashboard');
    });

    it('keeps search and hash', () => {
      expect(resolveRedirectUrl('/dashboard?tab=1&sort=asc#section', fallback)).toBe(
        '/dashboard?tab=1&sort=asc#section'
      );
    });

    it('returns the normalized path', () => {
      expect(resolveRedirectUrl('/a/../b?x=1#h', fallback)).toBe('/b?x=1#h');
    });
  });

  describe('invalid values', () => {
    it.each([
      ['null', null],
      ['an empty string', ''],
      ['a protocol-relative URL', '//evil.com'],
      ['an absolute URL', 'https://evil.com'],
      ['a path that normalizes to a protocol-relative URL', '/.//evil.com']
    ])('returns the fallback for %s', (_label, url) => {
      expect(resolveRedirectUrl(url, fallback)).toBe(fallback);
    });
  });

  describe('edge cases', () => {
    it.each([
      ['dot segments climbing above the root', '/a/../../evil.com', '/evil.com'],
      ['an encoded slash after a dot segment', '/%2e/%2fevil.com', '/%2fevil.com'],
      ['a non-breaking space between the slashes', '/\u{A0}/evil.com', '/%C2%A0/evil.com'],
      ['a fullwidth slash', '/／evil.com', '/%EF%BC%8Fevil.com'],
      ['a non-ASCII path', '/café', '/caf%C3%A9'],
      ['a trailing space', '/dashboard ', '/dashboard'],
      ['an empty search', '/?', '/'],
      ['an empty hash', '/#', '/'],
      ['only a hash', '/#a', '/#a'],
      ['only a search', '/?x=1', '/?x=1']
    ])('resolves %s', (_label, url, expected) => {
      expect(resolveRedirectUrl(url, fallback)).toBe(expected);
    });
  });

  describe('invariants', () => {
    it('never returns anything that could leave the origin', () => {
      const hostile = [
        '//evil.com',
        String.raw`/\evil.com`,
        '/.//evil.com',
        '/..//evil.com',
        '/%2e%2e//evil.com',
        '/\t/evil.com',
        '/\r/evil.com',
        '/\n/evil.com',
        '/a/../../evil.com',
        '/%2e/%2fevil.com',
        '/／／evil.com',
        'https://evil.com',
        'javascript:alert(1)'
      ];

      for (const url of hostile) {
        const resolved = resolveRedirectUrl(url, fallback);

        expect(resolved.startsWith('/')).toBe(true);
        expect(resolved.startsWith('//')).toBe(false);
        expect(resolved).not.toContain('\\');
      }
    });
  });
});

describe('buildAuthUrl', () => {
  const authRoute = '/auth/sign-in';

  describe('without a redirect url', () => {
    it('returns the route as is when it is omitted', () => {
      expect(buildAuthUrl(authRoute)).toBe(authRoute);
    });

    it('returns the route as is when it is empty', () => {
      expect(buildAuthUrl(authRoute, '')).toBe(authRoute);
    });
  });

  describe('with a redirect url', () => {
    it('appends it as the redirect_url search param', () => {
      expect(buildAuthUrl(authRoute, '/dashboard')).toBe('/auth/sign-in?redirect_url=%2Fdashboard');
    });
  });

  describe('edge cases', () => {
    it('encodes special characters so they cannot leak into the outer query', () => {
      expect(buildAuthUrl(authRoute, '/dashboard?a=1&b=2#hash')).toBe(
        '/auth/sign-in?redirect_url=%2Fdashboard%3Fa%3D1%26b%3D2%23hash'
      );
    });

    it('keeps an absolute URL as an opaque, encoded value', () => {
      expect(buildAuthUrl(authRoute, 'https://evil.com')).toBe(
        '/auth/sign-in?redirect_url=https%3A%2F%2Fevil.com'
      );
    });
  });

  describe('round trip with resolveRedirectUrl', () => {
    it('gives back the normalized redirect url', () => {
      const built = buildAuthUrl(authRoute, '/dashboard?a=1&b=two words#hash');
      const param = new URL(built, 'https://app.test').searchParams.get('redirect_url');

      expect(resolveRedirectUrl(param, '/home')).toBe('/dashboard?a=1&b=two%20words#hash');
    });

    it('does not let a hostile value survive', () => {
      const built = buildAuthUrl(authRoute, 'https://evil.com');
      const param = new URL(built, 'https://app.test').searchParams.get('redirect_url');

      expect(resolveRedirectUrl(param, '/home')).toBe('/home');
    });
  });
});
