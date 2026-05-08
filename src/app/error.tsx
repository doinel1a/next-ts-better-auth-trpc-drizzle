'use client';

import { IconArrowLeft, IconRefresh } from '@tabler/icons-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

const glitchBase = 'font-mono text-[8rem] leading-none font-black md:text-[11rem]';

type TErrorPage = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function ErrorPage({ error, reset }: TErrorPage) {
  return (
    <div className='relative flex h-full flex-col items-center justify-center gap-y-3 text-center'>
      <div className='pointer-events-none fixed inset-0 z-0 overflow-hidden' aria-hidden='true'>
        <div className='animate-nf-scanline via-destructive/25 absolute top-0 right-0 left-0 h-1 bg-linear-to-b from-transparent to-transparent' />
      </div>

      <p className='animate-nf-fade-up text-muted-foreground font-mono text-xs tracking-[0.25em] uppercase [animation-delay:0.05s]'>
        process.exit(500) // internal server error
      </p>

      <div className='animate-nf-fade-up relative select-none [animation-delay:0.2s]'>
        <span
          className={cn(
            glitchBase,
            'animate-nf-glitch-top absolute inset-0 text-[oklch(0.75_0.18_45)] opacity-75'
          )}
          aria-hidden='true'
        >
          500
        </span>
        <span
          className={cn(
            glitchBase,
            'animate-nf-glitch-bottom absolute inset-0 text-[oklch(0.65_0.18_10)] opacity-75'
          )}
          aria-hidden='true'
        >
          500
        </span>
        <h1 className={cn(glitchBase, 'animate-nf-flicker text-destructive relative')}>500</h1>
      </div>

      <div className='animate-nf-fade-up flex flex-col gap-y-1.5 [animation-delay:0.4s]'>
        <p className='text-foreground text-xl font-bold'>
          Something went wrong
          <span className='animate-nf-blink text-destructive ml-1.5' aria-hidden='true'>
            _
          </span>
        </p>
        <p className='text-muted-foreground max-w-xs text-sm'>
          An unexpected error occurred. Please try again or return to the homepage.
        </p>
        {error.digest === undefined ? null : (
          <p className='text-muted-foreground mt-1 font-mono text-[0.65rem] opacity-60'>
            digest: {error.digest}
          </p>
        )}
      </div>

      <div className='animate-nf-fade-up mt-2 flex gap-x-3 [animation-delay:0.6s]'>
        <Button variant='secondary' onClick={reset}>
          <IconRefresh data-icon='inline-start' />
          Try again
        </Button>
        <Button asChild>
          <Link href='/'>
            <IconArrowLeft data-icon='inline-start' />
            Back to home
          </Link>
        </Button>
      </div>
    </div>
  );
}
