'use client';

import { useCallback } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import Button from '@/components/commons/button';
import Form from '@/components/ui/controlled-form';
import Input from '@/components/ui/controlled-form/input';
import InputPassword from '@/components/ui/controlled-form/input-password';
import { useAuthRedirect } from '@/hooks/use-auth-redirect';
import { useSignUp } from '@/hooks/use-sign-up';
import { route } from '@/lib/constants/routes';
import clientLogger from '@/lib/utils/logger/client';

import Container from './container';

export default function SignUpForm() {
  const router = useRouter();
  const { redirectUrl } = useAuthRedirect(route.signIn);

  return (
    <SignUpFormContent
      onSuccess={() => {
        toast.success('Sign up successful');
        router.replace(redirectUrl);
      }}
      onError={(ctx) => {
        clientLogger.error('Sign up', ctx.error);
        toast.error(ctx.error.message);
      }}
    />
  );
}

type TSchema = z.infer<typeof schema>;
const schema = z
  .object({
    name: z.string().min(2),
    email: z.email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8)
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'Passwords do not match',
        path: ['confirmPassword']
      });
    }
  });

type TSignUpFormContent = Readonly<NonNullable<Parameters<typeof useSignUp>[0]>>;

function SignUpFormContent({ onSuccess, onError }: TSignUpFormContent) {
  const form = useForm<TSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const { isPending, submit } = useSignUp({ onSuccess, onError });

  const onSubmit = useCallback(
    ({ name, email, password }: TSchema) => {
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
