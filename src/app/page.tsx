import React from 'react';

import db from 'drizzle';
import dynamic from 'next/dynamic';

import { studentsSchema } from '~/drizzle/schemas/students';

import { Skeleton } from '@/components/ui/skeleton';

const Counter = dynamic(() => import('@/components/counter'), {
  loading: () => <Skeleton className='h-44 w-72 rounded-md' />
});

export default async function HomePage() {
  const students = await db.select().from(studentsSchema);
  console.log('students', students);

  return (
    <main className='flex h-full w-full flex-col items-center justify-center'>
      <Counter />
    </main>
  );
}
