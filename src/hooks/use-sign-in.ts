'use client';

import { useCallback, useState } from 'react';

import { signIn } from '@/server/auth/client';

type TOptions = NonNullable<Parameters<typeof signIn.email>[1]>;
type TCallbacks = Pick<TOptions, 'onSuccess' | 'onError'>;

type TCredentials = Parameters<typeof signIn.email>[0];

export function useSignIn({ onSuccess, onError }: TCallbacks = {}) {
  const [isPending, setIsPending] = useState(false);

  const submit = useCallback(
    async (credentials: TCredentials) => {
      await signIn.email(credentials, {
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
