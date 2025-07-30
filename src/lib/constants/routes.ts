import { env } from '@/env';

export const route = {
  home: '/',

  signUp: env.NEXT_PUBLIC_SIGN_UP_URL,
  signIn: env.NEXT_PUBLIC_SIGN_IN_URL
} as const;
