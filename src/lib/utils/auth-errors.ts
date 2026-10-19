import type { authClient } from '@/server/auth/client';

const TOO_MANY_REQUESTS_STATUS = 429;

type TErrorCode = keyof typeof authClient.$ERROR_CODES;

const errorMessages: Partial<Record<TErrorCode, string>> = {
  INVALID_EMAIL_OR_PASSWORD: 'Invalid email or password.',
  EMAIL_NOT_VERIFIED: 'Please verify your email before signing in.'
};

export function getAuthErrorMessage(error: { status: number; code?: unknown }, fallback: string) {
  if (error.status === TOO_MANY_REQUESTS_STATUS) {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  return isKnownErrorCode(error.code) ? (errorMessages[error.code] ?? fallback) : fallback;
}

function isKnownErrorCode(code: unknown): code is TErrorCode {
  return typeof code === 'string' && Object.hasOwn(errorMessages, code);
}
