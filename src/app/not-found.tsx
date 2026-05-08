import { IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';

import StatusPageContent from '@/components/commons/status-page';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className='relative flex h-full flex-col items-center justify-center gap-y-3 text-center'>
      <StatusPageContent
        code='404'
        title='Page not found'
        description="The route you're looking for doesn't exist or has been moved."
        label='process.exit(404) // route not found'
        codeColorClass='text-primary'
        codeColorTop='oklch(0.75 0.18 188)'
        codeColorBottom='oklch(0.65 0.18 250)'
        blinkColorClass='text-primary'
        scanlineColorClass='via-primary/25'
        actions={
          <Button asChild>
            <Link href='/'>
              <IconArrowLeft data-icon='inline-start' />
              Back to home
            </Link>
          </Button>
        }
      />
    </div>
  );
}
