import { FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';

type TFormErrorMessage = {
  name: string;
  className?: string;
};

export default function FormErrorMessage({ name, className }: Readonly<TFormErrorMessage>) {
  return (
    <FormMessage data-testid={`${name}-error-message`} className={cn('leading-none', className)} />
  );
}
