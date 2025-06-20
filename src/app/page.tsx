import React from 'react';

import db from 'drizzle';
import { usersSchema } from 'drizzle/schemas/users';
import dynamic from 'next/dynamic';

import { Skeleton } from '@/components/ui/skeleton';

const Counter = dynamic(() => import('@/components/counter'), {
  loading: () => <Skeleton className='h-44 w-72 rounded-md' />
});

export default async function HomePage() {
  const users = await db.select().from(usersSchema);
  console.log('users', users);

  return (
    <main className='flex h-full w-full flex-col items-center justify-center'>
      <Counter />
    </main>
  );
}
