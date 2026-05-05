'use client';

import { useCallback } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { route } from '@/lib/constants/routes';
import { signOut, useSession } from '@/server/auth/client';

import { Skeleton } from '../ui/skeleton';
import TablerIcon from './tabler';

export default function UserToggle() {
  const { isPending, data: session } = useSession();

  const router = useRouter();
  const onSignOutClick = useCallback(() => {
    void signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success('Sign out successful');
          router.refresh();
        }
      }
    });
  }, [router]);

  if (isPending) {
    return <Skeleton className='size-8 rounded-md' />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='icon'>
          <TablerIcon name='IconUser' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {session ? (
          <DropdownMenuItem variant='destructive' onClick={onSignOutClick}>
            Sign out
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem>
            <Link href={route.signIn}>Sign in</Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
