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
  rateLimit: {
    enabled: true, // on in development to test the limits locally
    storage: 'database',
    // default for every endpoint without a custom rule: 60 requests per 60 seconds
    window: 60,
    max: 60,
    customRules: {
      '/sign-in/email': { window: 60, max: 5 }, // 5 sign-in attempts per 60 seconds
      '/sign-up/email': { window: 60 * 60, max: 10 } // 10 sign-ups per hour (3600 seconds)
    }
  },
  advanced: {
    ipAddress: {
      // Vercel overwrites this header, so clients cannot spoof the IP used by the rate limiter
      ipAddressHeaders: ['x-vercel-forwarded-for']
    }
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
