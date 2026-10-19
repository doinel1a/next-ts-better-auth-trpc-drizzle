'use client';

import { useCallback } from 'react';

import type { TSignUpSchema } from '../sign-up/schema';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import Button from '@/components/commons/button';
import Form from '@/components/ui/controlled-form';
import Input from '@/components/ui/controlled-form/input';
import InputPassword from '@/components/ui/controlled-form/input-password';
import { useAuthRedirect } from '@/hooks/use-auth-redirect';
import { useSignUp } from '@/hooks/use-sign-up';
import { route } from '@/lib/constants/routes';
import { getAuthErrorMessage } from '@/lib/utils/auth-errors';
import clientLogger from '@/lib/utils/logger/client';

import { signUpSchema } from '../sign-up/schema';
import Container from './container';

export default function SignUpForm() {
  const router = useRouter();
  const { redirectUrl } = useAuthRedirect(route.signIn);

  return (
    <SignUpFormContent
      onSuccess={() => {
        // Better Auth answers a duplicate email like a new account (see `autoSignIn` in the auth
        // config), so this cannot say that an account was created
        toast.success('Request received. You can now sign in.');
        router.replace(redirectUrl);
      }}
      onError={(ctx) => {
        clientLogger.error('Sign up', ctx.error);
        toast.error(getAuthErrorMessage(ctx.error, 'Sign up failed. Please try again.'));
      }}
      onException={(error) => {
        clientLogger.error('Sign up', error);
        toast.error('Something went wrong. Check your connection and try again.');
      }}
    />
  );
}

type TSignUpFormContent = Readonly<NonNullable<Parameters<typeof useSignUp>[0]>>;

function SignUpFormContent({ onSuccess, onError, onException }: TSignUpFormContent) {
  const form = useForm<TSignUpSchema>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const { isPending, submit } = useSignUp({ onSuccess, onError, onException });

  const onSubmit = useCallback(
    ({ name, email, password }: TSignUpSchema) => {
      void submit({ name, email, password });
    },
    [submit]
  );

  return (
    <Container mode='sign-up'>
      <Form form={form} onValidForm={onSubmit}>
        <Input
          control={form.control}
          name='name'
          label='Name'
          type='text'
          disabled={isPending}
          isRequired
        />
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

        <InputPassword
          control={form.control}
          name='confirmPassword'
          label='Confirm password'
          disabled={isPending}
          isRequired
        />

        <Button type='submit' isLoading={isPending}>
          Sign up
        </Button>
      </Form>
    </Container>
  );
}
