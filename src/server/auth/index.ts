import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';

import * as schema from '~/drizzle/schemas/auth';

import { db } from '../db';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
    usePlural: true
  }),
  session: {
    // @docs https://www.better-auth.com/docs/guides/optimizing-for-performance#cookie-cache
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5 // 5 minutes
    }
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false
    // requireEmailVerification: true,
    // revokeSessionsOnPasswordReset: true
  },
  account: {
    accountLinking: {
      enabled: true
    }
  },
  plugins: [
    /**
      Must be the last plugin
      @docs https://www.better-auth.com/docs/integrations/next#server-action-cookies
    */
    nextCookies()
  ]
});
