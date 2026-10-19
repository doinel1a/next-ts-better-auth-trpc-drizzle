import type { ComponentProps } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import InputPassword from '@/components/ui/controlled-form/input-password';
import { Form } from '@/components/ui/form';
import { passwordSchema } from '@/lib/schemas/password';

const schema = z.object({
  password: passwordSchema,
  confirmPassword: passwordSchema
});

type TValues = z.infer<typeof schema>;
type TInputProperties = Partial<ComponentProps<typeof InputPassword<TValues>>>;

type THost = Readonly<{
  defaultPassword?: string;
  defaultConfirmPassword?: string;
  withConfirmation?: boolean;
  onValid?: (values: TValues) => void;
  inputProperties?: TInputProperties;
}>;

const validPassword = 'password1';

function Host({
  defaultPassword = '',
  defaultConfirmPassword = validPassword,
  withConfirmation,
  onValid,
  inputProperties
}: THost) {
  const form = useForm<TValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: defaultPassword, confirmPassword: defaultConfirmPassword }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => onValid?.(values))}>
        <InputPassword
          control={form.control}
          name='password'
          label='Password'
          {...inputProperties}
        />
        {withConfirmation === true && (
          <InputPassword control={form.control} name='confirmPassword' label='Confirm password' />
        )}
        <button type='submit'>Submit</button>
      </form>
    </Form>
  );
}

describe('InputPassword', () => {
  describe('the field', () => {
    it('is a password field with a label', () => {
      render(<Host />);

      expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
      expect(screen.getByTestId('password-label')).toHaveTextContent('Password');
    });

    it('starts with the default value of the form', () => {
      render(<Host defaultPassword='secret123' />);

      expect(screen.getByLabelText('Password')).toHaveValue('secret123');
    });

    it('hands what the visitor types to the form', async () => {
      const onValid = vi.fn();
      render(<Host onValid={onValid} />);

      const user = userEvent.setup();
      await user.type(screen.getByLabelText('Password'), 'typed-password');
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(onValid).toHaveBeenCalledExactlyOnceWith({
          password: 'typed-password',
          confirmPassword: 'password1'
        });
      });
    });

    it('forwards the usual input attributes to the field', () => {
      render(
        <Host
          inputProperties={{
            placeholder: 'Your password',
            autoComplete: 'new-password',
            maxLength: 20
          }}
        />
      );

      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('placeholder', 'Your password');
      expect(input).toHaveAttribute('autocomplete', 'new-password');
      expect(input).toHaveAttribute('maxlength', '20');
    });
  });

  describe('the visibility toggle', () => {
    it('starts with the password hidden', () => {
      render(<Host />);

      expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
      expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Hide password' })).not.toBeInTheDocument();
    });

    it('shows the password on the first click and hides it again on the second', async () => {
      render(<Host />);

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'Show password' }));

      expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
      expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Show password' })).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Hide password' }));

      expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
      expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument();
    });

    it('keeps what was typed while the password is shown and hidden', async () => {
      render(<Host />);

      const user = userEvent.setup();
      await user.type(screen.getByLabelText('Password'), 'password1');
      await user.click(screen.getByRole('button', { name: 'Show password' }));

      expect(screen.getByLabelText('Password')).toHaveValue('password1');

      await user.click(screen.getByRole('button', { name: 'Hide password' }));

      expect(screen.getByLabelText('Password')).toHaveValue('password1');
    });

    it('does not submit the form', async () => {
      const onValid = vi.fn();
      render(<Host defaultPassword='password1' onValid={onValid} />);

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'Show password' }));

      expect(onValid).not.toHaveBeenCalled();
      expect(screen.queryByTestId('password-error-message')).not.toBeInTheDocument();
    });

    it('shows one field at a time when a form has two', async () => {
      render(<Host withConfirmation />);

      const user = userEvent.setup();
      const toggles = screen.getAllByRole('button', { name: 'Show password' });
      expect(toggles).toHaveLength(2);

      const firstToggle = toggles.at(0);
      if (firstToggle === undefined) {
        throw new Error('Expected a toggle for each password field');
      }
      await user.click(firstToggle);

      expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText('Confirm password')).toHaveAttribute('type', 'password');
    });
  });

  describe('when disabled', () => {
    it('is enabled by default', () => {
      render(<Host />);

      expect(screen.getByLabelText('Password')).toBeEnabled();
      expect(screen.getByRole('button', { name: 'Show password' })).toBeEnabled();
    });

    it('disables the field and the toggle', () => {
      render(<Host inputProperties={{ disabled: true }} />);

      expect(screen.getByLabelText('Password')).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Show password' })).toBeDisabled();
    });

    it('keeps the password hidden when the toggle is clicked', async () => {
      render(<Host inputProperties={{ disabled: true }} />);

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'Show password' }));

      expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    });
  });

  describe('errors', () => {
    it('shows no error before the form is submitted', () => {
      render(<Host />);

      expect(screen.queryByTestId('password-error-message')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'false');
    });

    it('shows the error of the form under the field and marks the field as invalid', async () => {
      render(<Host defaultPassword='short' />);

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      expect(await screen.findByTestId('password-error-message')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
    });

    it('clears the error once the password is corrected', async () => {
      render(<Host defaultPassword='short' />);

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'Submit' }));
      await screen.findByTestId('password-error-message');

      await user.type(screen.getByLabelText('Password'), 'password1');
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(screen.queryByTestId('password-error-message')).not.toBeInTheDocument();
      });
      expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'false');
    });

    it('shows the error under the first field only when only that one is invalid', async () => {
      render(<Host withConfirmation defaultPassword='short' />);

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      expect(await screen.findByTestId('password-error-message')).toBeInTheDocument();
      expect(screen.queryByTestId('confirmPassword-error-message')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByLabelText('Confirm password')).toHaveAttribute('aria-invalid', 'false');
    });

    it('shows the error under the second field only when only that one is invalid', async () => {
      render(<Host withConfirmation defaultPassword='password1' defaultConfirmPassword='short' />);

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      expect(await screen.findByTestId('confirmPassword-error-message')).toBeInTheDocument();
      expect(screen.queryByTestId('password-error-message')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Confirm password')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'false');
    });

    it('shows both errors when both fields are invalid', async () => {
      render(<Host withConfirmation defaultPassword='short' defaultConfirmPassword='short' />);

      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'Submit' }));

      expect(await screen.findByTestId('password-error-message')).toBeInTheDocument();
      expect(screen.getByTestId('confirmPassword-error-message')).toBeInTheDocument();
    });
  });

  describe('labels', () => {
    it('marks the field as optional when it is not required', () => {
      render(<Host />);

      expect(screen.getByText('Optional')).toBeInTheDocument();
    });

    it('does not mark a required field as optional', () => {
      render(<Host inputProperties={{ isRequired: true }} />);

      expect(screen.queryByText('Optional')).not.toBeInTheDocument();
    });

    it('shows no label when none is given', () => {
      render(<Host inputProperties={{ label: undefined }} />);

      expect(screen.queryByTestId('password-label')).not.toBeInTheDocument();
      expect(screen.queryByText('Optional')).not.toBeInTheDocument();
    });
  });
});
