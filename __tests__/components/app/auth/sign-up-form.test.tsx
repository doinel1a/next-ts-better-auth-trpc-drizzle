import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

import SignUpForm from '@/app/auth/_components/sign-up-form';
import { signUp } from '@/server/auth/client';

import { createDeferred } from '../../../setup/helpers/deferred';
import { navigation } from '../../../setup/helpers/navigation';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

vi.mock('@/server/auth/client', () => ({
  signUp: { email: vi.fn() }
}));

type TCallbacks = NonNullable<Parameters<typeof signUp.email>[1]>;

const signUpEmail = vi.mocked(signUp.email);

const consoleError = vi.spyOn(console, 'error').mockReturnValue(undefined);

const name = 'Al';
const email = 'user@example.com';
const password = 'password1';

function respondWith(handler: (callbacks: TCallbacks) => Promise<void> | void) {
  signUpEmail.mockImplementation((async (_credentials: unknown, callbacks: TCallbacks) => {
    await handler(callbacks);
  }) as never);
}

type TValues = { name?: string; email?: string; password?: string; confirmPassword?: string };

async function fillAndSubmit(values: TValues = {}) {
  const user = userEvent.setup();
  const typedPassword = values.password ?? password;

  await user.type(screen.getByLabelText('Name'), values.name ?? name);
  await user.type(screen.getByLabelText('Email'), values.email ?? email);
  await user.type(screen.getByLabelText('Password'), typedPassword);
  await user.type(
    screen.getByLabelText('Confirm password'),
    values.confirmPassword ?? typedPassword
  );
  await user.click(screen.getByRole('button', { name: 'Sign up' }));

  return user;
}

beforeEach(() => {
  vi.clearAllMocks();
  signUpEmail.mockResolvedValue(undefined);
});

afterAll(() => {
  consoleError.mockRestore();
});

describe('SignUpForm', () => {
  describe('rendering', () => {
    it('shows the four fields and a sign up button', () => {
      render(<SignUpForm />);

      expect(screen.getByLabelText('Name')).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
      expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
      expect(screen.getByLabelText('Confirm password')).toHaveAttribute('type', 'password');
      expect(screen.getByRole('button', { name: 'Sign up' })).toBeEnabled();
    });

    it('starts with empty fields and no error', () => {
      render(<SignUpForm />);

      for (const label of ['Name', 'Email', 'Password', 'Confirm password']) {
        expect(screen.getByLabelText(label)).toHaveValue('');
      }
      for (const field of ['name', 'email', 'password', 'confirmPassword']) {
        expect(screen.queryByTestId(`${field}-error-message`)).not.toBeInTheDocument();
      }
    });
  });

  describe('validation', () => {
    it('shows an error under every field when the form is submitted empty', async () => {
      render(<SignUpForm />);

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'Sign up' }));

      for (const field of ['name', 'email', 'password', 'confirmPassword']) {
        expect(await screen.findByTestId(`${field}-error-message`)).toBeInTheDocument();
      }
      expect(signUpEmail).not.toHaveBeenCalled();
    });

    it.each([
      ['a name shorter than 2 characters', { name: 'A' }, 'name'],
      ['a name made only of spaces', { name: ' '.repeat(3) }, 'name'],
      ['an email the browser accepts but the schema does not', { email: 'a@b' }, 'email']
    ])('rejects %s', async (_label, values, field) => {
      render(<SignUpForm />);

      await fillAndSubmit(values);

      expect(await screen.findByTestId(`${field}-error-message`)).toBeInTheDocument();
      expect(signUpEmail).not.toHaveBeenCalled();
    });

    it('reports a short password on both password fields', async () => {
      render(<SignUpForm />);

      await fillAndSubmit({ password: '1234567' });

      expect(await screen.findByTestId('password-error-message')).toBeInTheDocument();
      expect(screen.getByTestId('confirmPassword-error-message')).toBeInTheDocument();
      expect(signUpEmail).not.toHaveBeenCalled();
    });

    it('tells the visitor when the passwords do not match', async () => {
      render(<SignUpForm />);

      await fillAndSubmit({ confirmPassword: 'password2' });

      expect(await screen.findByTestId('confirmPassword-error-message')).toHaveTextContent(
        'Passwords do not match'
      );
      expect(screen.queryByTestId('password-error-message')).not.toBeInTheDocument();
      expect(signUpEmail).not.toHaveBeenCalled();
    });

    it('submits once the confirmation is corrected', async () => {
      render(<SignUpForm />);

      const user = await fillAndSubmit({ confirmPassword: 'password2' });
      await screen.findByTestId('confirmPassword-error-message');

      await user.clear(screen.getByLabelText('Confirm password'));
      await user.type(screen.getByLabelText('Confirm password'), password);
      await user.click(screen.getByRole('button', { name: 'Sign up' }));

      await waitFor(() => {
        expect(signUpEmail).toHaveBeenCalledOnce();
      });
      expect(screen.queryByTestId('confirmPassword-error-message')).not.toBeInTheDocument();
    });
  });

  describe('successful sign up', () => {
    it('sends the name, the email and the password, without the confirmation', async () => {
      render(<SignUpForm />);

      await fillAndSubmit();

      await waitFor(() => {
        expect(signUpEmail).toHaveBeenCalledOnce();
      });

      const [credentials, callbacks] = signUpEmail.mock.calls[0] ?? [];
      expect(credentials).toEqual({ name, email, password });
      expect(typeof callbacks?.onSuccess).toBe('function');
      expect(typeof callbacks?.onError).toBe('function');
    });

    it('sends the name without the spaces around it', async () => {
      render(<SignUpForm />);

      await fillAndSubmit({ name: '  Al  ' });

      await waitFor(() => {
        expect(signUpEmail).toHaveBeenCalledOnce();
      });
      expect(signUpEmail.mock.calls[0]?.[0]).toMatchObject({ name: 'Al' });
    });

    it('does not navigate before the sign up succeeds', async () => {
      respondWith(() => undefined);
      render(<SignUpForm />);

      await fillAndSubmit();

      await waitFor(() => {
        expect(signUpEmail).toHaveBeenCalledOnce();
      });
      expect(navigation.replace).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('confirms with a toast and goes to the sign in page', async () => {
      respondWith(({ onSuccess }) => onSuccess?.({} as never));
      render(<SignUpForm />);

      await fillAndSubmit();

      await waitFor(() => {
        expect(navigation.replace).toHaveBeenCalledExactlyOnceWith('/auth/sign-in');
      });
      // The server answers the same way for a new account and for an email that is already
      // registered, so the message cannot promise that an account was created
      expect(toast.success).toHaveBeenCalledExactlyOnceWith(
        'Request received. You can now sign in.'
      );
      expect(toast.error).not.toHaveBeenCalled();
    });

    // The new account is not signed in (`autoSignIn: false`), so the proxy sends the visitor on to
    // sign in, which brings them back to this page afterwards
    it('goes to the page the visitor was trying to open', async () => {
      navigation.searchParams = new URLSearchParams({ redirect_url: '/dashboard?tab=1#section' });
      respondWith(({ onSuccess }) => onSuccess?.({} as never));
      render(<SignUpForm />);

      await fillAndSubmit();

      await waitFor(() => {
        expect(navigation.replace).toHaveBeenCalledExactlyOnceWith('/dashboard?tab=1#section');
      });
    });

    it.each([
      ['a protocol-relative URL', '//evil.com/phishing'],
      ['an absolute URL', 'https://evil.com/phishing'],
      ['a backslash URL', String.raw`/\evil.com/phishing`]
    ])('ignores a redirect to %s and goes to the sign in page', async (_label, redirectUrl) => {
      navigation.searchParams = new URLSearchParams({ redirect_url: redirectUrl });
      respondWith(({ onSuccess }) => onSuccess?.({} as never));
      render(<SignUpForm />);

      await fillAndSubmit();

      await waitFor(() => {
        expect(navigation.replace).toHaveBeenCalledExactlyOnceWith('/auth/sign-in');
      });
    });
  });

  describe('while signing up', () => {
    it('disables the fields and the button until the request ends', async () => {
      const request = createDeferred();
      signUpEmail.mockReturnValue(request.promise);
      render(<SignUpForm />);

      await fillAndSubmit();

      const submitButton = await screen.findByRole('button', { name: 'Sign up' });
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
      expect(submitButton).toHaveAttribute('aria-busy', 'true');
      for (const label of ['Name', 'Email', 'Password', 'Confirm password']) {
        expect(screen.getByLabelText(label)).toBeDisabled();
      }

      request.resolve();

      await waitFor(() => {
        expect(submitButton).toBeEnabled();
      });
      for (const label of ['Name', 'Email', 'Password', 'Confirm password']) {
        expect(screen.getByLabelText(label)).toBeEnabled();
      }
    });

    it('does not send a second request while the first one is running', async () => {
      const request = createDeferred();
      signUpEmail.mockReturnValue(request.promise);
      render(<SignUpForm />);

      const user = await fillAndSubmit();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Sign up' })).toBeDisabled();
      });
      await user.click(screen.getByRole('button', { name: 'Sign up' }));

      expect(signUpEmail).toHaveBeenCalledOnce();

      request.resolve();
    });
  });

  describe('failed sign up', () => {
    it.each([
      [
        'too many attempts',
        { status: 429 },
        'Too many attempts. Please wait a moment and try again.'
      ],
      [
        'an unknown error',
        { status: 500, code: 'SOMETHING_ELSE' },
        'Sign up failed. Please try again.'
      ]
    ])('explains %s with a toast and stays on the page', async (_label, error, message) => {
      respondWith(({ onError }) => onError?.({ error } as never));
      render(<SignUpForm />);

      await fillAndSubmit();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledExactlyOnceWith(message);
      });
      expect(toast.success).not.toHaveBeenCalled();
      expect(navigation.replace).not.toHaveBeenCalled();
    });

    it('asks to check the connection when the request throws', async () => {
      signUpEmail.mockRejectedValue(new TypeError('Failed to fetch'));
      render(<SignUpForm />);

      await fillAndSubmit();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledExactlyOnceWith(
          'Something went wrong. Check your connection and try again.'
        );
      });
      expect(navigation.replace).not.toHaveBeenCalled();
    });

    it('logs the error that made the sign up fail', async () => {
      const error = { status: 400, code: 'PASSWORD_TOO_LONG' };
      respondWith(({ onError }) => onError?.({ error } as never));
      render(<SignUpForm />);

      await fillAndSubmit();

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('CLIENT ERROR | Sign up', error);
      });
    });

    it('logs the exception that made the request throw', async () => {
      const exception = new TypeError('Failed to fetch');
      signUpEmail.mockRejectedValue(exception);
      render(<SignUpForm />);

      await fillAndSubmit();

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('CLIENT ERROR | Sign up', exception);
      });
    });

    it('keeps what was typed and lets the visitor try again', async () => {
      respondWith(({ onError }) =>
        onError?.({
          error: { status: 400, code: 'PASSWORD_TOO_LONG' }
        } as never)
      );
      render(<SignUpForm />);

      await fillAndSubmit();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledOnce();
      });
      expect(screen.getByLabelText('Name')).toHaveValue(name);
      expect(screen.getByLabelText('Email')).toHaveValue(email);
      expect(screen.getByLabelText('Password')).toHaveValue(password);
      expect(screen.getByLabelText('Confirm password')).toHaveValue(password);
      expect(screen.getByRole('button', { name: 'Sign up' })).toBeEnabled();
    });
  });
});
