'use client';

import { useCallback, useState } from 'react';

import { signUp } from '@/server/auth/client';

type TOptions = NonNullable<Parameters<typeof signUp.email>[1]>;
type TCallbacks = Pick<TOptions, 'onSuccess' | 'onError'>;

type TCredentials = Parameters<typeof signUp.email>[0];

export function useSignUp({ onSuccess, onError }: TCallbacks = {}) {
  const [isPending, setIsPending] = useState(false);

  const submit = useCallback(
    async (credentials: TCredentials) => {
      await signUp.email(credentials, {
        onRequest: () => {
          setIsPending(true);
        },
        onResponse: () => {
          setIsPending(false);
        },
        onSuccess,
        onError
      });
    },
    [onSuccess, onError]
  );

  return { isPending, submit };
}
