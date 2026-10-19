import { describe, expect, it } from 'vitest';

import { signUpSchema } from '@/app/auth/sign-up/schema';

const validForm = {
  name: 'Al',
  email: 'user@example.com',
  password: 'password1',
  confirmPassword: 'password1'
};

function getIssues(data: unknown) {
  const result = signUpSchema.safeParse(data);

  return result.success
    ? []
    : result.error.issues.map((issue) => `${issue.path.join('.')}:${issue.code}`);
}

describe('signUpSchema', () => {
  describe('valid form', () => {
    it('accepts a complete, matching form', () => {
      const result = signUpSchema.safeParse(validForm);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validForm);
    });

    it('accepts a name of exactly 2 characters and a password of exactly 8', () => {
      expect(
        getIssues({ ...validForm, name: 'Al', password: '12345678', confirmPassword: '12345678' })
      ).toEqual([]);
    });

    it('accepts a name with non-ASCII characters', () => {
      expect(getIssues({ ...validForm, name: 'Zoë' })).toEqual([]);
    });
  });

  describe('name', () => {
    it.each([
      ['a single character', 'A'],
      ['an empty string', '']
    ])('rejects %s', (_label, name) => {
      expect(getIssues({ ...validForm, name })).toEqual(['name:too_small']);
    });

    it.each([
      ['only spaces', '  '],
      ['only a tab and a newline', '\t\n'],
      ['one letter between spaces', ' A ']
    ])('rejects a name made of %s', (_label, name) => {
      expect(getIssues({ ...validForm, name })).toEqual(['name:too_small']);
    });

    it('trims the spaces around a name', () => {
      const result = signUpSchema.safeParse({ ...validForm, name: '  Al  ' });

      expect(result.data?.name).toBe('Al');
    });

    it('keeps the spaces inside a name', () => {
      const result = signUpSchema.safeParse({ ...validForm, name: 'Mary Ann' });

      expect(result.data?.name).toBe('Mary Ann');
    });
  });

  describe('email', () => {
    it.each([
      ['not an email', 'nope'],
      ['an address without a domain extension', 'a@b'],
      ['an empty string', '']
    ])('rejects %s', (_label, email) => {
      expect(getIssues({ ...validForm, email })).toEqual(['email:invalid_format']);
    });
  });

  describe('password', () => {
    it('rejects a password shorter than 8 characters, and the same short confirmation', () => {
      expect(getIssues({ ...validForm, password: '1234567', confirmPassword: '1234567' })).toEqual([
        'password:too_small',
        'confirmPassword:too_small'
      ]);
    });

    it('accepts a matching password and confirmation of exactly 128 characters', () => {
      const password = 'a'.repeat(128);

      expect(getIssues({ ...validForm, password, confirmPassword: password })).toEqual([]);
    });

    it('rejects a password and a confirmation longer than 128 characters', () => {
      const password = 'a'.repeat(129);

      expect(getIssues({ ...validForm, password, confirmPassword: password })).toEqual([
        'password:too_big',
        'confirmPassword:too_big'
      ]);
    });

    it('rejects a confirmation shorter than 8 characters', () => {
      expect(getIssues({ ...validForm, confirmPassword: '1234567' })).toContain(
        'confirmPassword:too_small'
      );
    });
  });

  describe('matching passwords', () => {
    it('reports one issue on the confirmation when the passwords differ', () => {
      const result = signUpSchema.safeParse({ ...validForm, confirmPassword: 'password2' });

      expect(result.error?.issues).toHaveLength(1);
      expect(result.error?.issues[0]).toMatchObject({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Passwords do not match'
      });
    });

    it.each([
      ['a different case', 'Password1'],
      ['a trailing space', 'password1 ']
    ])('treats %s as a different password', (_label, confirmPassword) => {
      expect(getIssues({ ...validForm, confirmPassword })).toEqual(['confirmPassword:custom']);
    });
  });

  describe('edge cases', () => {
    // Better Auth measures a password with `String.length`, so an emoji (2 UTF-16 units) counts twice
    it.each([
      ['4 emoji, which make 8 characters', '😀'.repeat(4)],
      ['64 emoji, which make exactly 128 characters', '😀'.repeat(64)]
    ])('accepts a password and a confirmation of %s', (_label, password) => {
      expect(getIssues({ ...validForm, password, confirmPassword: password })).toEqual([]);
    });

    it('rejects 3 emoji, which make only 6 characters', () => {
      const password = '😀'.repeat(3);

      expect(getIssues({ ...validForm, password, confirmPassword: password })).toEqual([
        'password:too_small',
        'confirmPassword:too_small'
      ]);
    });

    it('rejects 65 emoji, which make 130 characters', () => {
      const password = '😀'.repeat(65);

      expect(getIssues({ ...validForm, password, confirmPassword: password })).toEqual([
        'password:too_big',
        'confirmPassword:too_big'
      ]);
    });

    it('reports every invalid field at once', () => {
      expect(getIssues({ name: '', email: '', password: '', confirmPassword: '' })).toEqual([
        'name:too_small',
        'email:invalid_format',
        'password:too_small',
        'confirmPassword:too_small'
      ]);
    });

    it.each([
      ['a short name', { name: 'A' }, 'name:too_small'],
      ['an invalid email', { email: 'x' }, 'email:invalid_format']
    ])('still reports the mismatch next to %s', (_label, override, otherIssue) => {
      expect(getIssues({ ...validForm, ...override, confirmPassword: 'password2' })).toEqual([
        otherIssue,
        'confirmPassword:custom'
      ]);
    });

    it('reports both the length and the mismatch on a short, different confirmation', () => {
      expect(getIssues({ ...validForm, confirmPassword: 'other' })).toEqual([
        'confirmPassword:too_small',
        'confirmPassword:custom'
      ]);
    });

    it('reports missing fields as the wrong type, without a mismatch', () => {
      expect(getIssues({})).toEqual([
        'name:invalid_type',
        'email:invalid_type',
        'password:invalid_type',
        'confirmPassword:invalid_type'
      ]);
    });

    it('reports null fields as the wrong type', () => {
      expect(getIssues({ name: null, email: null, password: null, confirmPassword: null })).toEqual(
        [
          'name:invalid_type',
          'email:invalid_type',
          'password:invalid_type',
          'confirmPassword:invalid_type'
        ]
      );
    });

    it('drops fields that are not part of the form', () => {
      const result = signUpSchema.safeParse({ ...validForm, role: 'admin' });

      expect(result.data).toEqual(validForm);
    });
  });
});
