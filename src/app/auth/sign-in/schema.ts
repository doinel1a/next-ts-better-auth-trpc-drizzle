import { z } from 'zod';

import { passwordSchema } from '@/lib/schemas/password';

export type TSignInSchema = z.infer<typeof signInSchema>;
export const signInSchema = z.object({
  email: z.email(),
  password: passwordSchema
});
