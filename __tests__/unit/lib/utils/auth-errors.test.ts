import { BASE_ERROR_CODES } from 'better-auth';
import { describe, expect, it } from 'vitest';

import { getAuthErrorMessage } from '@/lib/utils/auth-errors';

const fallback = 'Something failed.';
const tooManyAttemptsMessage = 'Too many attempts. Please wait a moment and try again.';

describe('getAuthErrorMessage', () => {
  describe('known error codes', () => {
    it.each([
      ['wrong credentials', 401, 'INVALID_EMAIL_OR_PASSWORD', 'Invalid email or password.'],
      [
        'an unverified email',
        403,
        'EMAIL_NOT_VERIFIED',
        'Please verify your email before signing in.'
      ]
    ])('explains %s', (_label, status, code, expected) => {
      expect(getAuthErrorMessage({ status, code }, fallback)).toBe(expected);
    });

    it('does not depend on the status for a known code', () => {
      expect(
        getAuthErrorMessage({ status: 500, code: 'INVALID_EMAIL_OR_PASSWORD' }, fallback)
      ).toBe('Invalid email or password.');
    });
  });

  describe('rate limiting', () => {
    it('explains a 429 without a code', () => {
      expect(getAuthErrorMessage({ status: 429 }, fallback)).toBe(tooManyAttemptsMessage);
    });

    it('explains a 429 with an unknown code', () => {
      expect(getAuthErrorMessage({ status: 429, code: 'SOMETHING_ELSE' }, fallback)).toBe(
        tooManyAttemptsMessage
      );
    });

    it('takes precedence over a known code', () => {
      expect(
        getAuthErrorMessage({ status: 429, code: 'INVALID_EMAIL_OR_PASSWORD' }, fallback)
      ).toBe(tooManyAttemptsMessage);
    });
  });

  describe('fallback', () => {
    it.each([
      ['no code', { status: 500 }],
      ['an unknown code', { status: 400, code: 'SOMETHING_ELSE' }],
      ['a null code', { status: 400, code: null }],
      ['a numeric code', { status: 400, code: 42 }],
      ['an object code', { status: 400, code: { code: 'INVALID_EMAIL_OR_PASSWORD' } }],
      ['an empty code', { status: 400, code: '' }],
      ['a known code in lowercase', { status: 400, code: 'invalid_email_or_password' }],
      // With `autoSignIn: false` Better Auth answers a duplicate sign up like a new account, so this
      // code is never reported and has no message of its own (see the authentication flows tests)
      [
        'an email already in use, which a sign up does not report',
        { status: 422, code: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL' }
      ]
    ])('uses the fallback for %s', (_label, error) => {
      expect(getAuthErrorMessage(error, fallback)).toBe(fallback);
    });

    it('returns whatever fallback the caller passes', () => {
      expect(getAuthErrorMessage({ status: 500 }, 'Sign in failed. Please try again.')).toBe(
        'Sign in failed. Please try again.'
      );
      expect(getAuthErrorMessage({ status: 500 }, 'Sign up failed. Please try again.')).toBe(
        'Sign up failed. Please try again.'
      );
    });
  });

  describe('edge cases', () => {
    it.each([['toString'], ['__proto__'], ['constructor'], ['hasOwnProperty']])(
      'does not mistake the inherited property "%s" for an error code',
      (code) => {
        expect(getAuthErrorMessage({ status: 400, code }, fallback)).toBe(fallback);
      }
    );

    it.each([
      ['just below', 428],
      ['just above', 430],
      ['zero', 0]
    ])('does not treat a status %s 429 as rate limiting', (_label, status) => {
      expect(getAuthErrorMessage({ status }, fallback)).toBe(fallback);
    });

    it('returns an empty fallback as is', () => {
      expect(getAuthErrorMessage({ status: 500 }, '')).toBe('');
    });
  });

  // better-auth reports `error.code` with the same name as its server-side `BASE_ERROR_CODES` key.
  // If an upgrade renames one of the codes we map, the friendly message would silently stop showing
  describe('contract with better-auth', () => {
    it.each([['INVALID_EMAIL_OR_PASSWORD'], ['EMAIL_NOT_VERIFIED']] as const)(
      'still maps the %s code better-auth reports',
      (key) => {
        const { code } = BASE_ERROR_CODES[key];

        expect(code).toBe(key);
        expect(getAuthErrorMessage({ status: 400, code }, fallback)).not.toBe(fallback);
      }
    );
  });
});
