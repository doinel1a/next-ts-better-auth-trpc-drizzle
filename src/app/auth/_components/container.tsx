'use client';

import React, { useMemo } from 'react';

import type { PropsWithChildren } from 'react';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import LucideIcon from '@/components/commons/lucide';
import { Button } from '@/components/ui/button';
import { route } from '@/lib/constants/routes';
import { searchParamsKey } from '@/lib/constants/shared';
import { getAppBaseUrl } from '@/lib/utils/shared';

const baseUrl = getAppBaseUrl();

type TContainer = PropsWithChildren & {
  mode: 'sign-up' | 'sign-in';
};

export default function Container({ mode, children }: Readonly<TContainer>) {
  const isModeSignUp = useMemo(() => mode === 'sign-up', [mode]);

  const params = useSearchParams();
  const url = useMemo(() => {
    const authUrl = isModeSignUp ? route.signIn : route.signUp;
    const redirectUrl = params.get(searchParamsKey.redirectUrl);
    const url = new URL(authUrl, baseUrl);
    url.searchParams.set(searchParamsKey.redirectUrl, redirectUrl ?? '');
    return url;
  }, [isModeSignUp, params]);

  return (
    <div className='flex flex-col gap-y-5'>
      <section className='bg-secondary flex w-96 flex-col rounded-md p-1'>
        <div className='bg-background flex flex-col gap-y-5 rounded-sm p-5'>
          <div className='flex flex-col items-center'>
            <LucideIcon name='AtSign' size={50} className='text-primary mb-2.5' />
            <h1 className='text-lg font-semibold'>
              {isModeSignUp ? 'Create a D1A account' : 'Sign in to D1A'}
            </h1>
            <h2 className='text-sm'>
              {isModeSignUp
                ? 'Welcome! Create an account to get started'
                : 'Welcome back! Sign in to continue'}
            </h2>
          </div>
          {children}
        </div>

        <div className='flex items-center justify-center py-2'>
          <span className='text-sm'>
            {isModeSignUp ? 'Have an account?' : "Don't have an account?"}
          </span>
          <Button variant='link' asChild>
            <Link href={url}>{isModeSignUp ? 'Sign in' : 'Create account'}</Link>
          </Button>
        </div>
      </section>

      <div className='text-muted-foreground *:[a]:hover:text-foreground text-center text-xs text-balance *:[a]:underline-offset-4 *:[a]:hover:underline'>
        By continuing, you agree to our <Link href='#'>Terms of Service</Link> and{' '}
        <Link href='#'>Privacy Policy</Link>.
      </div>
    </div>
  );
}
