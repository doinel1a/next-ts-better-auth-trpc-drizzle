import { Suspense } from 'react';

import UserToggle from './commons/user-toggle';
import { Skeleton } from './ui/skeleton';
import ThemeToggle from './ui/theme-toggle';

export default function Navbar() {
  return (
    <header className='border-border flex h-16 w-full items-center justify-between border-b px-5'>
      <span className='text-lg font-black'>Template</span>

      <div className='flex gap-x-2.5 pr-20'>
        <Suspense fallback={<Skeleton className='size-8 rounded-md' />}>
          <UserToggle />
        </Suspense>
        <ThemeToggle />
      </div>
    </header>
  );
}
