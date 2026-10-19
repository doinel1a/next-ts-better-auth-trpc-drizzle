import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import SignInForm from '@/app/auth/_components/sign-in-form';
import { signIn } from '@/server/auth/client';

const navigation = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  searchParams: new URLSearchParams()
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: navigation.replace, refresh: navigation.refresh }),
  useSearchParams: () => navigation.searchParams
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

vi.mock('@/server/auth/client', () => ({
  signIn: { email: vi.fn() }
}));

type TCallbacks = NonNullable<Parameters<typeof signIn.email>[1]>;

const signInEmail = vi.mocked(signIn.email);
const consoleError = vi.spyOn(console, 'error').mockReturnValue(undefined);

const email = 'user@example.com';
const password = 'password1';

function respondWith(handler: (callbacks: TCallbacks) => Promise<void> | void) {
  signInEmail.mockImplementation((async (_credentials: unknown, callbacks: TCallbacks) => {
    await handler(callbacks);
  }) as never);
}

function createDeferred() {
  let resolve!: () => void;
  // eslint-disable-next-line unicorn/prefer-promise-with-resolvers
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
}

async function fillAndSubmit(values: { email?: string; password?: string } = {}) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Email'), values.email ?? email);
  await user.type(screen.getByLabelText('Password'), values.password ?? password);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));

  return user;
}

beforeEach(() => {
  vi.clearAllMocks();
  signInEmail.mockResolvedValue(undefined);
  navigation.searchParams = new URLSearchParams();
});

afterAll(() => {
  consoleError.mockRestore();
});

describe('SignInForm', () => {
  describe('rendering', () => {
    it('shows an email field, a password field and a sign in button', () => {
      render(<SignInForm />);

      expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
      expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
    });

    it('starts with empty fields and no error', () => {
      render(<SignInForm />);

      expect(screen.getByLabelText('Email')).toHaveValue('');
      expect(screen.getByLabelText('Password')).toHaveValue('');
      expect(screen.queryByTestId('email-error-message')).not.toBeInTheDocument();
      expect(screen.queryByTestId('password-error-message')).not.toBeInTheDocument();
    });
  });

  describe('validation', () => {
    it('shows an error under each field when the form is submitted empty', async () => {
      render(<SignInForm />);

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'Sign in' }));

      expect(await screen.findByTestId('email-error-message')).toBeInTheDocument();
      expect(screen.getByTestId('password-error-message')).toBeInTheDocument();
      expect(signInEmail).not.toHaveBeenCalled();
    });

    it('rejects an email the browser accepts but the schema does not', async () => {
      render(<SignInForm />);

      await fillAndSubmit({ email: 'a@b' });

      expect(await screen.findByTestId('email-error-message')).toBeInTheDocument();
      expect(screen.queryByTestId('password-error-message')).not.toBeInTheDocument();
      expect(signInEmail).not.toHaveBeenCalled();
    });

    it('rejects a password shorter than 8 characters', async () => {
      render(<SignInForm />);

      await fillAndSubmit({ password: '1234567' });

      expect(await screen.findByTestId('password-error-message')).toBeInTheDocument();
      expect(screen.queryByTestId('email-error-message')).not.toBeInTheDocument();
      expect(signInEmail).not.toHaveBeenCalled();
    });

    it('submits once the invalid fields are corrected', async () => {
      render(<SignInForm />);

      const user = await fillAndSubmit({ password: '1234567' });
      await screen.findByTestId('password-error-message');

      await user.type(screen.getByLabelText('Password'), '8');
      await user.click(screen.getByRole('button', { name: 'Sign in' }));

      await waitFor(() => {
        expect(signInEmail).toHaveBeenCalledOnce();
      });
      expect(screen.queryByTestId('password-error-message')).not.toBeInTheDocument();
    });
  });

  describe('successful sign in', () => {
    it('sends exactly the email and the password', async () => {
      render(<SignInForm />);

      await fillAndSubmit();

      await waitFor(() => {
        expect(signInEmail).toHaveBeenCalledOnce();
      });

      const [credentials, callbacks] = signInEmail.mock.calls[0] ?? [];
      expect(credentials).toEqual({ email, password });
      expect(typeof callbacks?.onSuccess).toBe('function');
      expect(typeof callbacks?.onError).toBe('function');
    });

    it('does not navigate before the sign in succeeds', async () => {
      respondWith(() => undefined);
      render(<SignInForm />);

      await fillAndSubmit();

      await waitFor(() => {
        expect(signInEmail).toHaveBeenCalledOnce();
      });
      expect(navigation.replace).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('confirms with a toast and goes to the home page', async () => {
      respondWith(({ onSuccess }) => onSuccess?.({} as never));
      render(<SignInForm />);

      await fillAndSubmit();

      await waitFor(() => {
        expect(navigation.replace).toHaveBeenCalledExactlyOnceWith('/');
      });
      expect(toast.success).toHaveBeenCalledExactlyOnceWith('Sign in successful');
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('goes back to the page the visitor was trying to open', async () => {
      navigation.searchParams = new URLSearchParams({ redirect_url: '/dashboard?tab=1#section' });
      respondWith(({ onSuccess }) => onSuccess?.({} as never));
      render(<SignInForm />);

      await fillAndSubmit();

      await waitFor(() => {
        expect(navigation.replace).toHaveBeenCalledExactlyOnceWith('/dashboard?tab=1#section');
      });
    });

    it.each([
      ['a protocol-relative URL', '//evil.com/phishing'],
      ['an absolute URL', 'https://evil.com/phishing'],
      ['a backslash URL', String.raw`/\evil.com/phishing`]
    ])('ignores a redirect to %s and goes to the home page', async (_label, redirectUrl) => {
      navigation.searchParams = new URLSearchParams({ redirect_url: redirectUrl });
      respondWith(({ onSuccess }) => onSuccess?.({} as never));
      render(<SignInForm />);

      await fillAndSubmit();

      await waitFor(() => {
        expect(navigation.replace).toHaveBeenCalledExactlyOnceWith('/');
      });
    });
  });

  describe('while signing in', () => {
    it('disables the fields and the button until the request ends', async () => {
      const request = createDeferred();
      signInEmail.mockReturnValue(request.promise);
      render(<SignInForm />);

      await fillAndSubmit();

      const submitButton = await screen.findByRole('button', { name: 'Sign in' });
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
      expect(submitButton).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByLabelText('Email')).toBeDisabled();
      expect(screen.getByLabelText('Password')).toBeDisabled();

      request.resolve();

      await waitFor(() => {
        expect(submitButton).toBeEnabled();
      });
      expect(screen.getByLabelText('Email')).toBeEnabled();
      expect(screen.getByLabelText('Password')).toBeEnabled();
    });

    it('does not send a second request while the first one is running', async () => {
      const request = createDeferred();
      signInEmail.mockReturnValue(request.promise);
      render(<SignInForm />);

      const user = await fillAndSubmit();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled();
      });
      await user.click(screen.getByRole('button', { name: 'Sign in' }));

      expect(signInEmail).toHaveBeenCalledOnce();

      request.resolve();
    });
  });

  describe('failed sign in', () => {
    it.each([
      [
        'wrong credentials',
        { status: 401, code: 'INVALID_EMAIL_OR_PASSWORD' },
        'Invalid email or password.'
      ],
      [
        'an unverified email',
        { status: 403, code: 'EMAIL_NOT_VERIFIED' },
        'Please verify your email before signing in.'
      ],
      [
        'too many attempts',
        { status: 429 },
        'Too many attempts. Please wait a moment and try again.'
      ],
      [
        'an unknown error',
        { status: 500, code: 'SOMETHING_ELSE' },
        'Sign in failed. Please try again.'
      ]
    ])('explains %s with a toast and stays on the page', async (_label, error, message) => {
      respondWith(({ onError }) => onError?.({ error } as never));
      render(<SignInForm />);

      await fillAndSubmit();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledExactlyOnceWith(message);
      });
      expect(toast.success).not.toHaveBeenCalled();
      expect(navigation.replace).not.toHaveBeenCalled();
    });

    it('asks to check the connection when the request throws', async () => {
      signInEmail.mockRejectedValue(new TypeError('Failed to fetch'));
      render(<SignInForm />);

      await fillAndSubmit();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledExactlyOnceWith(
          'Something went wrong. Check your connection and try again.'
        );
      });
      expect(navigation.replace).not.toHaveBeenCalled();
    });

    it('logs the error that made the sign in fail', async () => {
      const error = { status: 401, code: 'INVALID_EMAIL_OR_PASSWORD' };
      respondWith(({ onError }) => onError?.({ error } as never));
      render(<SignInForm />);

      await fillAndSubmit();

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('CLIENT ERROR | Sign in', error);
      });
    });

    it('logs the exception that made the request throw', async () => {
      const exception = new TypeError('Failed to fetch');
      signInEmail.mockRejectedValue(exception);
      render(<SignInForm />);

      await fillAndSubmit();

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('CLIENT ERROR | Sign in', exception);
      });
    });

    it('keeps what was typed and lets the visitor try again', async () => {
      respondWith(({ onError }) =>
        onError?.({ error: { status: 401, code: 'INVALID_EMAIL_OR_PASSWORD' } } as never)
      );
      render(<SignInForm />);

      await fillAndSubmit();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledOnce();
      });
      expect(screen.getByLabelText('Email')).toHaveValue(email);
      expect(screen.getByLabelText('Password')).toHaveValue(password);
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
    });
  });
});
