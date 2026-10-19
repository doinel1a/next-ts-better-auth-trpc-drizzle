import { eq } from 'drizzle-orm';

import { sessions, users } from '~/drizzle/schemas/auth';

import { auth } from '@/server/auth';
import { db } from '@/server/db';

export const testUserEmail = 'user@example.com';

export async function signInAsTestUser() {
  await auth.api.signUpEmail({
    body: { name: 'Al', email: testUserEmail, password: 'password1' }
  });

  const response = await auth.api.signInEmail({
    body: { email: testUserEmail, password: 'password1' },
    asResponse: true
  });

  const cookies = response.headers.getSetCookie().map((cookie) => cookie.split(';', 1)[0] ?? '');

  return {
    sessionOnly: cookies
      .filter((cookie) => cookie.startsWith('better-auth.session_token='))
      .join('; '),
    browser: cookies.join('; ')
  };
}

async function getTestUserId() {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, testUserEmail));
  if (user === undefined) {
    throw new Error('Expected the test user to exist');
  }

  return user.id;
}

export async function expireTestUserSession() {
  await db
    .update(sessions)
    .set({ expiresAt: new Date(Date.now() - 1000) })
    .where(eq(sessions.userId, await getTestUserId()));
}

export async function revokeTestUserSession() {
  await db.delete(sessions).where(eq(sessions.userId, await getTestUserId()));
}
