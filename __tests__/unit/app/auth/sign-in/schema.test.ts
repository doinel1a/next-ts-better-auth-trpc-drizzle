import { describe, expect, it } from 'vitest';

import { signInSchema } from '@/app/auth/sign-in/schema';

const validCredentials = { email: 'user@example.com', password: 'password1' };

// Zod's default messages are library text, so the tests look at which field failed and why
function getIssues(data: unknown) {
  const result = signInSchema.safeParse(data);

  return result.success
    ? []
    : result.error.issues.map((issue) => `${issue.path.join('.')}:${issue.code}`);
}

describe('signInSchema', () => {
  describe('valid credentials', () => {
    it('accepts a valid email and password', () => {
      const result = signInSchema.safeParse(validCredentials);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validCredentials);
    });

    it('accepts a password of exactly 8 characters', () => {
      expect(getIssues({ ...validCredentials, password: '12345678' })).toEqual([]);
    });
  });

  describe('email', () => {
    it.each([
      ['not an email', 'nope'],
      ['an address without a domain extension', 'a@b'],
      ['an address with surrounding spaces', ' user@example.com '],
      ['an empty string', '']
    ])('rejects %s', (_label, email) => {
      expect(getIssues({ ...validCredentials, email })).toEqual(['email:invalid_format']);
    });
  });

  describe('password', () => {
    it('rejects a password shorter than 8 characters', () => {
      expect(getIssues({ ...validCredentials, password: '1234567' })).toEqual([
        'password:too_small'
      ]);
    });

    it('accepts a password of exactly 128 characters', () => {
      expect(getIssues({ ...validCredentials, password: 'a'.repeat(128) })).toEqual([]);
    });

    it('rejects a password longer than 128 characters', () => {
      expect(getIssues({ ...validCredentials, password: 'a'.repeat(129) })).toEqual([
        'password:too_big'
      ]);
    });

    it('rejects an empty password', () => {
      expect(getIssues({ ...validCredentials, password: '' })).toEqual(['password:too_small']);
    });
  });

  describe('edge cases', () => {
    // Better Auth measures a password with `String.length`, so an emoji (2 UTF-16 units) counts twice
    it.each([
      ['4 emoji, which make 8 characters', '😀'.repeat(4)],
      ['64 emoji, which make exactly 128 characters', '😀'.repeat(64)]
    ])('accepts a password of %s', (_label, password) => {
      expect(getIssues({ ...validCredentials, password })).toEqual([]);
    });

    it('rejects 3 emoji, which make only 6 characters', () => {
      expect(getIssues({ ...validCredentials, password: '😀'.repeat(3) })).toEqual([
        'password:too_small'
      ]);
    });

    it('rejects 65 emoji, which make 130 characters', () => {
      expect(getIssues({ ...validCredentials, password: '😀'.repeat(65) })).toEqual([
        'password:too_big'
      ]);
    });

    it('reports every invalid field at once', () => {
      expect(getIssues({ email: 'nope', password: 'short' })).toEqual([
        'email:invalid_format',
        'password:too_small'
      ]);
    });

    it('reports missing fields as the wrong type', () => {
      expect(getIssues({})).toEqual(['email:invalid_type', 'password:invalid_type']);
    });

    it('reports null fields as the wrong type', () => {
      expect(getIssues({ email: null, password: null })).toEqual([
        'email:invalid_type',
        'password:invalid_type'
      ]);
    });

    it('drops fields that are not part of the form', () => {
      const result = signInSchema.safeParse({ ...validCredentials, admin: true });

      expect(result.data).toEqual(validCredentials);
    });

    it('does not change the password it is given', () => {
      const result = signInSchema.safeParse({ ...validCredentials, password: '  spaced out  ' });

      expect(result.data?.password).toBe('  spaced out  ');
    });
  });
});
