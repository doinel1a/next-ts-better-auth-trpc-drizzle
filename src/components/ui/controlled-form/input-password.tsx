'use client';

import { useCallback, useState } from 'react';

import type { ComponentProps } from 'react';
import type { Control, FieldValues, Path } from 'react-hook-form';

import TablerIcon from '@/components/commons/tabler';
import { FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input as SCN_Input } from '@/components/ui/form/input';
import { cn } from '@/lib/utils/cn';

import FormErrorMessage from './shared/error-message';
import FormLabel from './shared/label';

type TInput = Omit<ComponentProps<'input'>, 'type'>;
type TInputPassword<TFormSchema extends FieldValues> = TInput & {
  control: Control<TFormSchema>;
  name: Path<TFormSchema>;
  label?: string;
  isRequired?: boolean;
};

export default function InputPassword<TFormSchema extends FieldValues>({
  control,
  name,
  label,
  isRequired,
  className,
  disabled,
  ...otherProperties
}: TInputPassword<TFormSchema>) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const onPasswordButtonClick = useCallback(() => {
    setIsPasswordVisible((previousState) => !previousState);
  }, []);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('w-full', className)}>
          <FormLabel name={name} label={label} isRequired={isRequired} />
          <div className='relative'>
            <FormControl>
              <SCN_Input
                type={isPasswordVisible ? 'text' : 'password'}
                className='pr-10.5 placeholder:italic'
                disabled={disabled}
                {...otherProperties}
                {...field}
              />
            </FormControl>

            <button
              type='button'
              tabIndex={-1}
              className='text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 disabled:pointer-events-none disabled:opacity-50'
              aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
              disabled={disabled}
              onClick={onPasswordButtonClick}
            >
              <TablerIcon name={isPasswordVisible ? 'IconEyeOff' : 'IconEye'} />
            </button>
          </div>

          <FormErrorMessage name={name} />
        </FormItem>
      )}
    />
  );
}
