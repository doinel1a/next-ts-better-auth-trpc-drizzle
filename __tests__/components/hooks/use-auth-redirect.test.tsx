import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useAuthRedirect } from '@/hooks/use-auth-redirect';

import { navigation } from '../../setup/helpers/navigation';

function renderAuthRedirect(query: string, fallback = '/home') {
  navigation.searchParams = new URLSearchParams(query);

  return renderHook(() => useAuthRedirect(fallback));
}

describe('useAuthRedirect', () => {
  describe('redirectUrl', () => {
    it('is the fallback when the page was opened without a redirect', () => {
      const { result } = renderAuthRedirect('');

      expect(result.current.redirectUrl).toBe('/home');
    });

    it.each([['/home'], ['/auth/sign-in'], ['/']])(
      'is the fallback it was given, %s',
      (fallback) => {
        const { result } = renderAuthRedirect('', fallback);

        expect(result.current.redirectUrl).toBe(fallback);
      }
    );

    it('is the page the visitor was trying to open', () => {
      const { result } = renderAuthRedirect('redirect_url=%2Fdashboard');

      expect(result.current.redirectUrl).toBe('/dashboard');
    });

    it('keeps the search and the hash of that page', () => {
      const { result } = renderAuthRedirect('redirect_url=%2Fdashboard%3Ftab%3D1%23section');

      expect(result.current.redirectUrl).toBe('/dashboard?tab=1#section');
    });

    it('is the normalized path', () => {
      const { result } = renderAuthRedirect('redirect_url=%2Fa%2F..%2Fb');

      expect(result.current.redirectUrl).toBe('/b');
    });
  });

  describe('redirectUrl, when the redirect cannot be trusted', () => {
    it('is the fallback when the redirect is empty', () => {
      const { result } = renderAuthRedirect('redirect_url=');

      expect(result.current.redirectUrl).toBe('/home');
    });

    // Each one has a path, so the fallback is clearly different from what would be left over
    // if the value were only stripped down to its path
    it.each([
      ['a protocol-relative URL', '//evil.com/phishing'],
      ['an absolute URL', 'https://evil.com/phishing'],
      ['a backslash URL', String.raw`/\evil.com/phishing`],
      ['a bare host', 'evil.com/phishing']
    ])('is the fallback when the redirect is %s', (_label, redirectUrl) => {
      const { result } = renderAuthRedirect(
        new URLSearchParams({ redirect_url: redirectUrl }).toString()
      );

      expect(result.current.redirectUrl).toBe('/home');
    });
  });

  describe('buildAuthUrl', () => {
    it.each([
      ['sign-up', '/auth/sign-up'],
      ['sign-in', '/auth/sign-in']
    ])('links to %s as is when there is no redirect', (_label, route) => {
      const { result } = renderAuthRedirect('');

      expect(result.current.buildAuthUrl(route)).toBe(route);
    });

    it('links to the other page keeping the redirect', () => {
      const { result } = renderAuthRedirect('redirect_url=%2Fdashboard');

      expect(result.current.buildAuthUrl('/auth/sign-up')).toBe(
        '/auth/sign-up?redirect_url=%2Fdashboard'
      );
    });

    it('keeps the search and the hash of the redirect, encoded', () => {
      const { result } = renderAuthRedirect('redirect_url=%2Fdashboard%3Fa%3D1%26b%3D2%23section');

      expect(result.current.buildAuthUrl('/auth/sign-in')).toBe(
        '/auth/sign-in?redirect_url=%2Fdashboard%3Fa%3D1%26b%3D2%23section'
      );
    });

    it('links to the page without a redirect when the redirect is empty', () => {
      const { result } = renderAuthRedirect('redirect_url=');

      expect(result.current.buildAuthUrl('/auth/sign-up')).toBe('/auth/sign-up');
    });

    it('keeps a valid redirect as it was written, without normalizing it', () => {
      const { result } = renderAuthRedirect('redirect_url=%2Fa%2F..%2Fb');

      expect(result.current.buildAuthUrl('/auth/sign-up')).toBe(
        '/auth/sign-up?redirect_url=%2Fa%2F..%2Fb'
      );
    });

    it.each([
      ['a protocol-relative URL', '//evil.com/phishing'],
      ['an absolute URL', 'https://evil.com/phishing'],
      ['a backslash URL', String.raw`/\evil.com/phishing`],
      ['a bare host', 'evil.com/phishing']
    ])('does not carry %s over to the other page', (_label, redirectUrl) => {
      const { result } = renderAuthRedirect(
        new URLSearchParams({ redirect_url: redirectUrl }).toString()
      );

      expect(result.current.buildAuthUrl('/auth/sign-up')).toBe('/auth/sign-up');
    });

    it('hands the redirect over so the next page reads the same one', () => {
      const { result } = renderAuthRedirect('redirect_url=%2Fdashboard%3Ftab%3D1%23section');

      const link = result.current.buildAuthUrl('/auth/sign-up');
      const { result: nextPage } = renderAuthRedirect(link.split('?', 2)[1] ?? '');

      expect(nextPage.current.redirectUrl).toBe('/dashboard?tab=1#section');
    });
  });

  describe('edge cases', () => {
    it('uses the first redirect when the query repeats it', () => {
      const { result } = renderAuthRedirect('redirect_url=%2Fa&redirect_url=%2Fb');

      expect(result.current.redirectUrl).toBe('/a');
      expect(result.current.buildAuthUrl('/auth/sign-up')).toBe('/auth/sign-up?redirect_url=%2Fa');
    });

    it('ignores the other parameters of the query', () => {
      const { result } = renderAuthRedirect('foo=1&redirect_url=%2Fa&bar=2');

      expect(result.current.redirectUrl).toBe('/a');
      expect(result.current.buildAuthUrl('/auth/sign-up')).toBe('/auth/sign-up?redirect_url=%2Fa');
    });

    it('is the fallback when the query has only other parameters', () => {
      const { result } = renderAuthRedirect('foo=1');

      expect(result.current.redirectUrl).toBe('/home');
      expect(result.current.buildAuthUrl('/auth/sign-up')).toBe('/auth/sign-up');
    });

    it('follows the query when it changes', () => {
      const { result, rerender } = renderAuthRedirect('redirect_url=%2Fa');
      expect(result.current.redirectUrl).toBe('/a');

      navigation.searchParams = new URLSearchParams('redirect_url=%2Fb');
      rerender();

      expect(result.current.redirectUrl).toBe('/b');
      expect(result.current.buildAuthUrl('/auth/sign-up')).toBe('/auth/sign-up?redirect_url=%2Fb');
    });

    it('falls back when the redirect disappears from the query', () => {
      const { result, rerender } = renderAuthRedirect('redirect_url=%2Fa');

      navigation.searchParams = new URLSearchParams('');
      rerender();

      expect(result.current.redirectUrl).toBe('/home');
      expect(result.current.buildAuthUrl('/auth/sign-up')).toBe('/auth/sign-up');
    });
  });
});
