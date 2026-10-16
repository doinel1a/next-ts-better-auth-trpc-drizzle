import { Suspense } from 'react';

import { redirectIfAuthenticated } from '@/server/auth/server';

import SignUpForm from '../_components/sign-up-form';

type TSignUpPage = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function SignUpPage({ searchParams }: TSignUpPage) {
  await redirectIfAuthenticated(searchParams);

  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}
