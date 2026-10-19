import { z } from 'zod';

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/lib/constants/auth';

export const passwordSchema = z.string().superRefine((password, ctx) => {
  if (password.length < PASSWORD_MIN_LENGTH) {
    ctx.addIssue({
      code: 'too_small',
      origin: 'string',
      minimum: PASSWORD_MIN_LENGTH,
      inclusive: true,
      input: password
    });
  } else if (password.length > PASSWORD_MAX_LENGTH) {
    ctx.addIssue({
      code: 'too_big',
      origin: 'string',
      maximum: PASSWORD_MAX_LENGTH,
      inclusive: true,
      input: password
    });
  }
});
