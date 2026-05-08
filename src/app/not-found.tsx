import { IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

const glitchBase = 'font-mono text-[8rem] leading-none font-black md:text-[11rem]';

export default function NotFoundPage() {
  return (
    <div className='relative flex h-full flex-col items-center justify-center gap-y-3 text-center'>
      <div className='pointer-events-none fixed inset-0 z-0 overflow-hidden' aria-hidden='true'>
        <div className='animate-nf-scanline via-primary/25 absolute top-0 right-0 left-0 h-1 bg-linear-to-b from-transparent to-transparent' />
      </div>

      <p className='animate-nf-fade-up text-muted-foreground font-mono text-xs tracking-[0.25em] uppercase [animation-delay:0.05s]'>
        process.exit(404) // route not found
      </p>

      <div className='animate-nf-fade-up relative select-none [animation-delay:0.2s]'>
        <span
          className={cn(
            glitchBase,
            'animate-nf-glitch-top absolute inset-0 text-[oklch(0.75_0.18_188)] opacity-75'
          )}
          aria-hidden='true'
        >
          404
        </span>
        <span
          className={cn(
            glitchBase,
            'animate-nf-glitch-bottom absolute inset-0 text-[oklch(0.65_0.18_250)] opacity-75'
          )}
          aria-hidden='true'
        >
          404
        </span>
        <h1 className={cn(glitchBase, 'animate-nf-flicker text-primary relative')}>404</h1>
      </div>

      <div className='animate-nf-fade-up flex flex-col gap-y-1.5 [animation-delay:0.4s]'>
        <p className='text-foreground text-xl font-bold'>
          Page not found
          <span className='animate-nf-blink text-primary ml-1.5' aria-hidden='true'>
            _
          </span>
        </p>
        <p className='text-muted-foreground max-w-xs text-sm'>
          The route you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>

      <div className='animate-nf-fade-up mt-2 [animation-delay:0.6s]'>
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
