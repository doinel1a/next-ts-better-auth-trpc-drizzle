import React, { Suspense } from 'react';

import SignUpForm from '../_components/sign-up-form';

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}
