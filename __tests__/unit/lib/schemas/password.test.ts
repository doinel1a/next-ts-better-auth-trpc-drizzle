import { describe, expect, it } from 'vitest';

import { passwordSchema } from '@/lib/schemas/password';

describe('passwordSchema', () => {
  describe('valid passwords', () => {
    it.each([
      ['exactly 8 characters', 'a'.repeat(8)],
      ['a typical password', 'correct horse battery'],
      ['exactly 128 characters', 'a'.repeat(128)]
    ])('accepts %s', (_label, password) => {
      expect(passwordSchema.safeParse(password).success).toBe(true);
    });

    it('returns the password unchanged', () => {
      expect(passwordSchema.parse('P@ssw0rd!')).toBe('P@ssw0rd!');
    });
  });

  describe('length limits', () => {
    it.each([
      ['an empty string', ''],
      ['7 characters', 'a'.repeat(7)]
    ])('rejects %s as too short, with the minimum of 8 included', (_label, password) => {
      const result = passwordSchema.safeParse(password);

      expect(result.error?.issues).toHaveLength(1);
      expect(result.error?.issues[0]).toMatchObject({
        code: 'too_small',
        origin: 'string',
        minimum: 8,
        inclusive: true
      });
    });

    it('rejects 129 characters as too long, with the maximum of 128 included', () => {
      const result = passwordSchema.safeParse('a'.repeat(129));

      expect(result.error?.issues).toHaveLength(1);
      expect(result.error?.issues[0]).toMatchObject({
        code: 'too_big',
        origin: 'string',
        maximum: 128,
        inclusive: true
      });
    });

    it('rejects a very long password without reporting a second issue', () => {
      const result = passwordSchema.safeParse('a'.repeat(1_000_000));

      expect(result.error?.issues.map((issue) => issue.code)).toEqual(['too_big']);
    });
  });

  // Better Auth measures a password with `String.length`, so the schema counts UTF-16 units too
  describe('how characters are counted', () => {
    it.each([
      ['an emoji as two characters', '😀'.repeat(4), '😀'.repeat(3)],
      ['a letter and its combining accent as two characters', 'é'.repeat(4), 'é'.repeat(3)]
    ])('counts %s', (_label, longEnough, tooShort) => {
      expect(passwordSchema.safeParse(longEnough).success).toBe(true);
      expect(passwordSchema.safeParse(tooShort).error?.issues[0]?.code).toBe('too_small');
    });

    it('counts a character in the Basic Multilingual Plane as one', () => {
      expect(passwordSchema.safeParse('漢'.repeat(8)).success).toBe(true);
      expect(passwordSchema.safeParse('漢'.repeat(7)).error?.issues[0]?.code).toBe('too_small');
    });

    it('counts an unpaired surrogate as one character', () => {
      expect(passwordSchema.safeParse('\u{D83D}'.repeat(8)).success).toBe(true);
      expect(passwordSchema.safeParse('\u{D83D}'.repeat(7)).error?.issues[0]?.code).toBe(
        'too_small'
      );
    });

    it('reaches the maximum at 64 emoji', () => {
      expect(passwordSchema.safeParse('😀'.repeat(64)).success).toBe(true);
      expect(passwordSchema.safeParse('😀'.repeat(65)).error?.issues[0]?.code).toBe('too_big');
    });
  });

  describe('edge cases', () => {
    it.each([
      ['undefined', undefined],
      ['null', null],
      ['a number', 12_345_678],
      ['an object', {}],
      ['an array of one long string', ['a'.repeat(8)]]
    ])('reports %s as the wrong type, not as a length problem', (_label, value) => {
      const result = passwordSchema.safeParse(value);

      expect(result.error?.issues).toHaveLength(1);
      expect(result.error?.issues[0]).toMatchObject({ code: 'invalid_type', expected: 'string' });
    });

    it.each([
      ['leading and trailing spaces', '  pass1234  '],
      ['inner spaces', 'pass word 1234'],
      ['only spaces', ' '.repeat(8)]
    ])('keeps %s as typed', (_label, password) => {
      expect(passwordSchema.parse(password)).toBe(password);
    });

    it('counts the spaces around a password towards its length', () => {
      expect(passwordSchema.safeParse(`  ${'a'.repeat(4)}  `).success).toBe(true);
      expect(passwordSchema.safeParse(`  ${'a'.repeat(3)}  `).error?.issues[0]?.code).toBe(
        'too_small'
      );
    });

    it('throws a ZodError from parse for an invalid password', () => {
      expect(() => passwordSchema.parse('short')).toThrow();
    });
  });
});
