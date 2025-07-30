import React from 'react';

import db from 'drizzle';
import { headers } from 'next/headers';
import { redirect, RedirectType } from 'next/navigation';

import { studentsSchema } from '~/drizzle/schemas/students';

import { auth } from '@/lib/auth';
import { route } from '@/lib/constants/routes';

export default async function HomePage() {
  const students = await db.select().from(studentsSchema);
  console.log('students', students);

  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect(route.signIn, RedirectType.push);
  }

  return (
    <main className='flex h-full w-full flex-col items-center justify-center gap-y-5'>
      {session.user.name && <h1 className='text-xl'>Welcome, {session.user.name}!</h1>}
    </main>
  );
}
