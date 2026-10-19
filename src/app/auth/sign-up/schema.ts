import { z } from 'zod';

import { passwordSchema } from '@/lib/schemas/password';

export type TSignUpSchema = z.infer<typeof signUpSchema>;
export const signUpSchema = z
  .object({
    name: z.string().trim().min(2),
    email: z.email(),
    password: passwordSchema,
    confirmPassword: passwordSchema
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Passwords do not match',
        path: ['confirmPassword']
      });
    }
  });
