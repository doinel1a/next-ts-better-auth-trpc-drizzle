import React, { Suspense } from 'react';

import SignInForm from '../_components/sign-in-form';

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
