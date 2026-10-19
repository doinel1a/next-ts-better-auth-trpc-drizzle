import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSignIn } from '@/hooks/use-sign-in';
import { signIn } from '@/server/auth/client';

vi.mock('@/server/auth/client', () => ({
  signIn: { email: vi.fn() }
}));

type TSignInOptions = NonNullable<Parameters<typeof signIn.email>[1]>;

const credentials = { email: 'user@example.com', password: 'password1' };

function createCallbacks() {
  return { onSuccess: vi.fn(), onError: vi.fn(), onException: vi.fn() };
}

function createDeferred() {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  // eslint-disable-next-line unicorn/prefer-promise-with-resolvers
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

const signInEmail = vi.mocked(signIn.email);

beforeEach(() => {
  signInEmail.mockReset();
  signInEmail.mockResolvedValue(undefined);
});

describe('useSignIn', () => {
  describe('submitting the credentials', () => {
    it('is not pending before anything is submitted', () => {
      const { result } = renderHook(() => useSignIn(createCallbacks()));

      expect(result.current.isPending).toBe(false);
      expect(signInEmail).not.toHaveBeenCalled();
    });

    it('sends the credentials with the success and error callbacks', async () => {
      const callbacks = createCallbacks();
      const { result } = renderHook(() => useSignIn(callbacks));

      await act(() => result.current.submit(credentials));

      expect(signInEmail).toHaveBeenCalledExactlyOnceWith(credentials, {
        onSuccess: callbacks.onSuccess,
        onError: callbacks.onError
      });
    });

    it('is pending while the request is in flight and settles afterwards', async () => {
      const request = createDeferred();
      signInEmail.mockReturnValue(request.promise);
      const { result } = renderHook(() => useSignIn(createCallbacks()));

      let submission!: Promise<void>;
      act(() => {
        submission = result.current.submit(credentials);
      });

      expect(result.current.isPending).toBe(true);

      await act(async () => {
        request.resolve();
        await submission;
      });

      expect(result.current.isPending).toBe(false);
    });
  });

  describe('responses reported by the client', () => {
    it('forwards a successful response to onSuccess only', async () => {
      const callbacks = createCallbacks();
      signInEmail.mockImplementation((async (_credentials: unknown, options: TSignInOptions) => {
        await options.onSuccess?.({} as never);
      }) as never);
      const { result } = renderHook(() => useSignIn(callbacks));

      await act(() => result.current.submit(credentials));

      expect(callbacks.onSuccess).toHaveBeenCalledOnce();
      expect(callbacks.onError).not.toHaveBeenCalled();
      expect(callbacks.onException).not.toHaveBeenCalled();
    });

    it('forwards an API error to onError, not onException', async () => {
      const callbacks = createCallbacks();
      const context = { error: { status: 401, code: 'INVALID_EMAIL_OR_PASSWORD' } };
      signInEmail.mockImplementation((async (_credentials: unknown, options: TSignInOptions) => {
        await options.onError?.(context as never);
      }) as never);
      const { result } = renderHook(() => useSignIn(callbacks));

      await act(() => result.current.submit(credentials));

      expect(callbacks.onError).toHaveBeenCalledExactlyOnceWith(context);
      expect(callbacks.onException).not.toHaveBeenCalled();
      expect(result.current.isPending).toBe(false);
    });
  });

  describe('exceptions', () => {
    it('reports a thrown error to onException, not onError', async () => {
      const callbacks = createCallbacks();
      const networkError = new TypeError('Failed to fetch');
      signInEmail.mockRejectedValue(networkError);
      const { result } = renderHook(() => useSignIn(callbacks));

      await act(() => result.current.submit(credentials));

      expect(callbacks.onException).toHaveBeenCalledExactlyOnceWith(networkError);
      expect(callbacks.onError).not.toHaveBeenCalled();
      expect(callbacks.onSuccess).not.toHaveBeenCalled();
    });

    it('stops being pending after an exception', async () => {
      signInEmail.mockRejectedValue(new Error('boom'));
      const { result } = renderHook(() => useSignIn(createCallbacks()));

      await act(() => result.current.submit(credentials));

      expect(result.current.isPending).toBe(false);
    });

    it('does not reject the promise returned by submit', async () => {
      signInEmail.mockRejectedValue(new Error('boom'));
      const { result } = renderHook(() => useSignIn(createCallbacks()));

      await expect(act(() => result.current.submit(credentials))).resolves.toBeUndefined();
    });

    it('is pending until a rejected request settles', async () => {
      const request = createDeferred();
      signInEmail.mockReturnValue(request.promise);
      const { result } = renderHook(() => useSignIn(createCallbacks()));

      let submission!: Promise<void>;
      act(() => {
        submission = result.current.submit(credentials);
      });

      expect(result.current.isPending).toBe(true);

      await act(async () => {
        request.reject(new Error('boom'));
        await submission;
      });

      expect(result.current.isPending).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('uses the callbacks of the latest render', async () => {
      const first = createCallbacks();
      const second = createCallbacks();
      signInEmail.mockRejectedValue(new Error('boom'));
      const { result, rerender } = renderHook((callbacks) => useSignIn(callbacks), {
        initialProps: first
      });

      rerender(second);
      await act(() => result.current.submit(credentials));

      expect(second.onException).toHaveBeenCalledOnce();
      expect(first.onException).not.toHaveBeenCalled();
    });

    it('can be submitted again after a failure', async () => {
      const callbacks = createCallbacks();
      signInEmail.mockRejectedValueOnce(new Error('boom'));
      const { result } = renderHook(() => useSignIn(callbacks));

      await act(() => result.current.submit(credentials));
      await act(() => result.current.submit(credentials));

      expect(signInEmail).toHaveBeenCalledTimes(2);
      expect(callbacks.onException).toHaveBeenCalledOnce();
      expect(result.current.isPending).toBe(false);
    });
  });
});
