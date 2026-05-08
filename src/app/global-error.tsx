'use client';

import '@/global.css';

import { IconArrowLeft, IconRefresh } from '@tabler/icons-react';
import Link from 'next/link';

import StatusPageContent from '@/components/commons/status-page';
import { Button } from '@/components/ui/button';

type TGlobalErrorPage = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function GlobalErrorPage({ error, reset }: TGlobalErrorPage) {
  return (
    <html lang='en'>
      <body className='bg-background text-foreground'>
        <div className='relative flex min-h-dvh flex-col items-center justify-center gap-y-3 px-2.5 text-center'>
          <StatusPageContent
            code='500'
            title='Critical error'
            description='A critical error occurred in the application. Please try again or return to the homepage.'
            label='process.exit(500) // critical error'
            codeColorClass='text-destructive'
            codeColorTop='oklch(0.75 0.18 45)'
            codeColorBottom='oklch(0.65 0.18 10)'
            blinkColorClass='text-destructive'
            scanlineColorClass='via-destructive/25'
            actions={
              <>
                <Button variant='outline' onClick={reset}>
                  <IconRefresh data-icon='inline-start' />
                  Try again
                </Button>
                <Button asChild>
                  <Link href='/'>
                    <IconArrowLeft data-icon='inline-start' />
                    Back to home
                  </Link>
                </Button>
              </>
            }
            digest={error.digest}
          />
        </div>
      </body>
    </html>
  );
}
