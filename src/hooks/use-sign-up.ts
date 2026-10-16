'use client';

import { useCallback, useState } from 'react';

import { signUp } from '@/server/auth/client';

type TOptions = NonNullable<Parameters<typeof signUp.email>[1]>;
type TCallbacks = Pick<TOptions, 'onSuccess' | 'onError'> & {
  /**
    Called when the request throws instead of returning a response (e.g. network failure), in which
    case `onError` is never called.
  */
  onException: (error: unknown) => void;
};

type TCredentials = Parameters<typeof signUp.email>[0];

export function useSignUp({ onSuccess, onError, onException }: TCallbacks) {
  const [isPending, setIsPending] = useState(false);

  const submit = useCallback(
    async (credentials: TCredentials) => {
      setIsPending(true);

      try {
        await signUp.email(credentials, { onSuccess, onError });
      } catch (error) {
        onException(error);
      } finally {
        setIsPending(false);
      }
    },
    [onSuccess, onError, onException]
  );

  return { isPending, submit };
}
