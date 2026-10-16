import { Suspense } from 'react';

import { redirectIfAuthenticated } from '@/server/auth/server';

import SignInForm from '../_components/sign-in-form';

type TSignInPage = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function SignInPage({ searchParams }: TSignInPage) {
  await redirectIfAuthenticated(searchParams);

  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
