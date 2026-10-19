'use client';

import { useCallback } from 'react';

import type { TSignInSchema } from '../sign-in/schema';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import Button from '@/components/commons/button';
import Form from '@/components/ui/controlled-form';
import Input from '@/components/ui/controlled-form/input';
import InputPassword from '@/components/ui/controlled-form/input-password';
import { useAuthRedirect } from '@/hooks/use-auth-redirect';
import { useSignIn } from '@/hooks/use-sign-in';
import { route } from '@/lib/constants/routes';
import { getAuthErrorMessage } from '@/lib/utils/auth-errors';
import clientLogger from '@/lib/utils/logger/client';

import { signInSchema } from '../sign-in/schema';
import Container from './container';

export default function SignInForm() {
  const router = useRouter();
  const { redirectUrl } = useAuthRedirect(route.home);

  return (
    <SignInFormContent
      onSuccess={() => {
        toast.success('Sign in successful');
        router.replace(redirectUrl);
      }}
      onError={(ctx) => {
        clientLogger.error('Sign in', ctx.error);
        toast.error(getAuthErrorMessage(ctx.error, 'Sign in failed. Please try again.'));
      }}
      onException={(error) => {
        clientLogger.error('Sign in', error);
        toast.error('Something went wrong. Check your connection and try again.');
      }}
    />
  );
}

type TSignInFormContent = Readonly<NonNullable<Parameters<typeof useSignIn>[0]>>;

function SignInFormContent({ onSuccess, onError, onException }: TSignInFormContent) {
  const form = useForm<TSignInSchema>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const { isPending, submit } = useSignIn({ onSuccess, onError, onException });

  const onSubmit = useCallback(
    ({ email, password }: TSignInSchema) => {
      void submit({ email, password });
    },
    [submit]
  );

  return (
    <Container mode='sign-in'>
      <Form form={form} onValidForm={onSubmit}>
        <Input
          control={form.control}
          name='email'
          label='Email'
          type='email'
          disabled={isPending}
          isRequired
        />
        <InputPassword
          control={form.control}
          name='password'
          label='Password'
          disabled={isPending}
          isRequired
        />

        <Button type='submit' isLoading={isPending}>
          Sign in
        </Button>
      </Form>
    </Container>
  );
}
