import { describe, expect, it } from 'vitest';

import { auth } from '@/server/auth';

function signUp(password: string) {
  return auth.api.signUpEmail({
    body: { name: 'Al', email: 'user@example.com', password }
  });
}

describe('password length enforced by Better Auth', () => {
  describe('valid lengths', () => {
    it('creates the account with a password of exactly 8 characters', async () => {
      const result = await signUp('a'.repeat(8));

      expect(result.user.email).toBe('user@example.com');
    });

    it('creates the account with a password of exactly 128 characters', async () => {
      const result = await signUp('a'.repeat(128));

      expect(result.user.email).toBe('user@example.com');
    });
  });

  describe('characters outside the Basic Multilingual Plane', () => {
    it('counts an emoji as two characters, so 4 emoji are long enough', async () => {
      const result = await signUp('😀'.repeat(4));

      expect(result.user.email).toBe('user@example.com');
    });

    it('counts an emoji as two characters, so 64 emoji reach exactly 128', async () => {
      const result = await signUp('😀'.repeat(64));

      expect(result.user.email).toBe('user@example.com');
    });

    it('rejects 3 emoji, which make only 6 characters', async () => {
      await expect(signUp('😀'.repeat(3))).rejects.toMatchObject({
        body: { code: 'PASSWORD_TOO_SHORT' }
      });
    });

    it('rejects 65 emoji, which make 130 characters', async () => {
      await expect(signUp('😀'.repeat(65))).rejects.toMatchObject({
        body: { code: 'PASSWORD_TOO_LONG' }
      });
    });
  });

  describe('invalid lengths', () => {
    it('rejects a password shorter than 8 characters', async () => {
      await expect(signUp('a'.repeat(7))).rejects.toMatchObject({
        body: { code: 'PASSWORD_TOO_SHORT' }
      });
    });

    it('rejects a password longer than 128 characters', async () => {
      await expect(signUp('a'.repeat(129))).rejects.toMatchObject({
        body: { code: 'PASSWORD_TOO_LONG' }
      });
    });
  });
});
