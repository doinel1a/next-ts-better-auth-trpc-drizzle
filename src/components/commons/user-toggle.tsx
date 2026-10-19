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
import { useAuthRedirect } from '@/hooks/use-auth-redirect';
import { route } from '@/lib/constants/routes';
import { signOut, useSession } from '@/server/auth/client';

import { Skeleton } from '../ui/skeleton';
import TablerIcon from './tabler';

export default function UserToggle() {
  const { isPending, data: session } = useSession();

  const router = useRouter();
  const { buildAuthUrl } = useAuthRedirect(route.home);

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

  return isPending ? (
    <Skeleton className='size-8 rounded-md' />
  ) : (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='icon'>
          <TablerIcon name='IconUser' />
          <span className='sr-only'>User menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {session ? (
          <DropdownMenuItem variant='destructive' onClick={onSignOutClick}>
            Sign out
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link href={buildAuthUrl(route.signIn)}>Sign in</Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
