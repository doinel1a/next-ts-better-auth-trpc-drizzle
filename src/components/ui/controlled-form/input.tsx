'use client';

import React, { useCallback, useMemo, useState } from 'react';

import type { ComponentProps } from 'react';
import type { Control, FieldValues, Path } from 'react-hook-form';

import TablerIcon from '@/components/commons/tabler';
import { FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input as SCN_Input } from '@/components/ui/form/input';
import { cn } from '@/lib/utils';

import FormErrorMessage from './shared/error-message';
import FormLabel from './shared/label';

type TInput<TFormSchema extends FieldValues> = ComponentProps<'input'> & {
  control: Control<TFormSchema>;
  name: Path<TFormSchema>;
  label?: string;
  isRequired?: boolean;
};

export default function Input<TFormSchema extends FieldValues>({
  control,
  name,
  label,
  isRequired,
  type,
  className,
  disabled,
  ...otherProperties
}: TInput<TFormSchema>) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = useMemo(() => type === 'password', [type]);
  const onPasswordButtonClick = useCallback(() => {
    setIsPasswordVisible(!isPasswordVisible);
  }, [isPasswordVisible]);

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
                type={isPassword && isPasswordVisible ? 'text' : type}
                className='pr-10.5 placeholder:italic'
                disabled={disabled}
                {...otherProperties}
                {...field}
              />
            </FormControl>

            {isPassword && (
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
            )}
          </div>

          <FormErrorMessage name={name} />
        </FormItem>
      )}
    />
  );
}
