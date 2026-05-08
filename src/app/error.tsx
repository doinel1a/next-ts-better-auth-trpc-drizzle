'use client';

import { IconArrowLeft, IconRefresh } from '@tabler/icons-react';
import Link from 'next/link';

import StatusPageContent from '@/components/commons/status-page';
import { Button } from '@/components/ui/button';

type TErrorPage = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function ErrorPage({ error, reset }: TErrorPage) {
  return (
    <div className='relative flex h-full flex-col items-center justify-center gap-y-3 text-center'>
      <StatusPageContent
        code='500'
        title='Something went wrong'
        description='An unexpected error occurred. Please try again or return to the homepage.'
        label='process.exit(500) // internal server error'
        codeColorClass='text-destructive'
        codeColorTop='oklch(0.75 0.18 45)'
        codeColorBottom='oklch(0.65 0.18 10)'
        blinkColorClass='text-destructive'
        scanlineColorClass='via-destructive/25'
        actions={
          <>
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
          </>
        }
        digest={error.digest}
      />
    </div>
  );
}
