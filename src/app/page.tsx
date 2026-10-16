import { redirect, RedirectType } from 'next/navigation';

import { route } from '@/lib/constants/routes';
import { getSession } from '@/server/auth/server';
import { api } from '@/server/trpc';

export default async function HomePage() {
  const session = await getSession();
  if (!session) {
    redirect(route.signIn, RedirectType.replace);
  }

  const students = await api.students.getFirst();
  // eslint-disable-next-line no-console
  console.log('students', students);

  return (
    <main className='flex h-full w-full flex-col items-center justify-center gap-y-5'>
      {session.user.name && <h1 className='text-xl'>Welcome, {session.user.name}!</h1>}
    </main>
  );
}
