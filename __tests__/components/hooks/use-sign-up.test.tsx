import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSignUp } from '@/hooks/use-sign-up';
import { signUp } from '@/server/auth/client';

import { createDeferred } from '../../setup/helpers/deferred';

vi.mock('@/server/auth/client', () => ({
  signUp: { email: vi.fn() }
}));

type TSignUpOptions = NonNullable<Parameters<typeof signUp.email>[1]>;

const credentials = { name: 'Al', email: 'user@example.com', password: 'password1' };

function createCallbacks() {
  return { onSuccess: vi.fn(), onError: vi.fn(), onException: vi.fn() };
}

const signUpEmail = vi.mocked(signUp.email);

beforeEach(() => {
  signUpEmail.mockReset();
  signUpEmail.mockResolvedValue(undefined);
});

describe('useSignUp', () => {
  describe('submitting the credentials', () => {
    it('is not pending before anything is submitted', () => {
      const { result } = renderHook(() => useSignUp(createCallbacks()));

      expect(result.current.isPending).toBe(false);
      expect(signUpEmail).not.toHaveBeenCalled();
    });

    it('sends the credentials with the success and error callbacks', async () => {
      const callbacks = createCallbacks();
      const { result } = renderHook(() => useSignUp(callbacks));

      await act(() => result.current.submit(credentials));

      expect(signUpEmail).toHaveBeenCalledExactlyOnceWith(credentials, {
        onSuccess: callbacks.onSuccess,
        onError: callbacks.onError
      });
    });

    it('is pending while the request is in flight and settles afterwards', async () => {
      const request = createDeferred();
      signUpEmail.mockReturnValue(request.promise);
      const { result } = renderHook(() => useSignUp(createCallbacks()));

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
      signUpEmail.mockImplementation((async (_credentials: unknown, options: TSignUpOptions) => {
        await options.onSuccess?.({} as never);
      }) as never);
      const { result } = renderHook(() => useSignUp(callbacks));

      await act(() => result.current.submit(credentials));

      expect(callbacks.onSuccess).toHaveBeenCalledOnce();
      expect(callbacks.onError).not.toHaveBeenCalled();
      expect(callbacks.onException).not.toHaveBeenCalled();
    });

    it('forwards an API error to onError, not onException', async () => {
      const callbacks = createCallbacks();
      const context = { error: { status: 400, code: 'PASSWORD_TOO_LONG' } };
      signUpEmail.mockImplementation((async (_credentials: unknown, options: TSignUpOptions) => {
        await options.onError?.(context as never);
      }) as never);
      const { result } = renderHook(() => useSignUp(callbacks));

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
      signUpEmail.mockRejectedValue(networkError);
      const { result } = renderHook(() => useSignUp(callbacks));

      await act(() => result.current.submit(credentials));

      expect(callbacks.onException).toHaveBeenCalledExactlyOnceWith(networkError);
      expect(callbacks.onError).not.toHaveBeenCalled();
      expect(callbacks.onSuccess).not.toHaveBeenCalled();
    });

    it('stops being pending after an exception', async () => {
      signUpEmail.mockRejectedValue(new Error('boom'));
      const { result } = renderHook(() => useSignUp(createCallbacks()));

      await act(() => result.current.submit(credentials));

      expect(result.current.isPending).toBe(false);
    });

    it('does not reject the promise returned by submit', async () => {
      signUpEmail.mockRejectedValue(new Error('boom'));
      const { result } = renderHook(() => useSignUp(createCallbacks()));

      await expect(act(() => result.current.submit(credentials))).resolves.toBeUndefined();
    });

    it('is pending until a rejected request settles', async () => {
      const request = createDeferred();
      signUpEmail.mockReturnValue(request.promise);
      const { result } = renderHook(() => useSignUp(createCallbacks()));

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
      signUpEmail.mockRejectedValue(new Error('boom'));
      const { result, rerender } = renderHook((callbacks) => useSignUp(callbacks), {
        initialProps: first
      });

      rerender(second);
      await act(() => result.current.submit(credentials));

      expect(second.onException).toHaveBeenCalledOnce();
      expect(first.onException).not.toHaveBeenCalled();
    });

    it('can be submitted again after a failure', async () => {
      const callbacks = createCallbacks();
      signUpEmail.mockRejectedValueOnce(new Error('boom'));
      const { result } = renderHook(() => useSignUp(callbacks));

      await act(() => result.current.submit(credentials));
      await act(() => result.current.submit(credentials));

      expect(signUpEmail).toHaveBeenCalledTimes(2);
      expect(callbacks.onException).toHaveBeenCalledOnce();
      expect(result.current.isPending).toBe(false);
    });
  });
});
