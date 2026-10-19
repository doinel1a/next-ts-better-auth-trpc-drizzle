import { describe, expect, it } from 'vitest';

import { redirectIfAuthenticated } from '@/server/auth/server';

import { visitWith } from '../../setup/helpers/request';
import { expireTestUserSession, revokeTestUserSession, signInAsTestUser } from '../helpers/session';

type TSearchParams = Record<string, string | string[] | undefined>;

/**
  `redirect()` of Next.js stops the page by throwing an error that describes where to go. This reads
  that description, and gives back `null` when the page was allowed to carry on.
*/
async function getRedirect(searchParams: TSearchParams = {}) {
  try {
    await redirectIfAuthenticated(Promise.resolve(searchParams));
  } catch (error) {
    const digest = (error as { digest?: unknown }).digest;
    const match =
      typeof digest === 'string' ? /^NEXT_REDIRECT;(\w+);(.*);\d{3};$/.exec(digest) : null;
    if (match === null) {
      throw error;
    }

    return { type: match[1], url: match[2] };
  }

  return null;
}

async function visitAsSignedInUser() {
  const { sessionOnly } = await signInAsTestUser();
  visitWith(sessionOnly);
}

describe('redirectIfAuthenticated', () => {
  describe('for a visitor who is not signed in', () => {
    it.each([
      ['no cookie at all', undefined],
      ['a session cookie nobody issued', 'better-auth.session_token=abc'],
      ['a cookie that has nothing to do with the session', 'theme=dark']
    ])('lets the page show for a visitor with %s', async (_label, cookie) => {
      visitWith(cookie);

      expect(await getRedirect({ redirect_url: '/dashboard' })).toBeNull();
    });

    it('lets the page show once the session has expired', async () => {
      const { sessionOnly } = await signInAsTestUser();
      await expireTestUserSession();
      visitWith(sessionOnly);

      expect(await getRedirect()).toBeNull();
    });

    it('lets the page show once the session has been revoked', async () => {
      const { sessionOnly } = await signInAsTestUser();
      await revokeTestUserSession();
      visitWith(sessionOnly);

      expect(await getRedirect()).toBeNull();
    });
  });

  describe('for a signed in visitor', () => {
    it('goes to the home page when there is no redirect', async () => {
      await visitAsSignedInUser();

      expect(await getRedirect()).toEqual({ type: 'replace', url: '/' });
    });

    it('goes to the page the visitor was trying to open', async () => {
      await visitAsSignedInUser();

      expect(await getRedirect({ redirect_url: '/dashboard' })).toEqual({
        type: 'replace',
        url: '/dashboard'
      });
    });

    it('keeps the search and the hash of that page', async () => {
      await visitAsSignedInUser();

      expect(await getRedirect({ redirect_url: '/dashboard?tab=1#section' })).toEqual({
        type: 'replace',
        url: '/dashboard?tab=1#section'
      });
    });

    it('goes to the normalized path', async () => {
      await visitAsSignedInUser();

      expect(await getRedirect({ redirect_url: '/a/../b?x=1' })).toEqual({
        type: 'replace',
        url: '/b?x=1'
      });
    });

    it('replaces the sign in page in the history, instead of adding to it', async () => {
      await visitAsSignedInUser();

      const redirect = await getRedirect({ redirect_url: '/dashboard' });

      expect(redirect?.type).toBe('replace');
    });
  });

  describe('for a signed in visitor, when the redirect cannot be trusted', () => {
    // Each one has a path, so going home is clearly different from what would be left over if the
    // value were only stripped down to its path
    it.each([
      ['a protocol-relative URL', '//evil.com/phishing'],
      ['an absolute URL', 'https://evil.com/phishing'],
      ['a backslash URL', String.raw`/\evil.com/phishing`],
      ['a bare host', 'evil.com/phishing'],
      ['a path that collapses into a protocol-relative URL', '/.//evil.com/phishing']
    ])('goes to the home page for %s', async (_label, redirectUrl) => {
      await visitAsSignedInUser();

      expect(await getRedirect({ redirect_url: redirectUrl })).toEqual({
        type: 'replace',
        url: '/'
      });
    });
  });

  describe('for a signed in visitor, whatever shape the query has', () => {
    it.each([
      ['an empty redirect', { redirect_url: '' }],
      ['a missing redirect', { redirect_url: undefined }],
      ['only other parameters', { foo: '/dashboard' }]
    ] satisfies [string, TSearchParams][])(
      'goes to the home page for %s',
      async (_label, params) => {
        await visitAsSignedInUser();

        expect(await getRedirect(params)).toEqual({ type: 'replace', url: '/' });
      }
    );

    it('goes to the home page when the list of redirects is empty', async () => {
      await visitAsSignedInUser();

      expect(await getRedirect({ redirect_url: [] })).toEqual({ type: 'replace', url: '/' });
    });
  });

  // Like the sign in and sign up forms (see `useAuthRedirect`), the first value of a repeated
  // redirect is the one that counts
  describe('for a signed in visitor, when the redirect is repeated', () => {
    it('goes to the first one', async () => {
      await visitAsSignedInUser();

      expect(await getRedirect({ redirect_url: ['/a', '/b?x=1'] })).toEqual({
        type: 'replace',
        url: '/a'
      });
    });

    it('goes to the home page when the first one cannot be trusted, instead of trying the next', async () => {
      await visitAsSignedInUser();

      expect(await getRedirect({ redirect_url: ['//evil.com/phishing', '/b'] })).toEqual({
        type: 'replace',
        url: '/'
      });
    });

    it('goes to the home page when the first one is empty, instead of trying the next', async () => {
      await visitAsSignedInUser();

      expect(await getRedirect({ redirect_url: ['', '/b'] })).toEqual({
        type: 'replace',
        url: '/'
      });
    });
  });
});
