import { FormLabel as SCN_FormLabel } from '@/components/ui/form';
import { cn } from '@/lib/utils';

import OptionalBadge from './optional-badge';

type TFormLabel = {
  name: string;
  label?: string;
  isRequired?: boolean;
  className?: string;
};

export default function FormLabel({ name, label, isRequired, className }: Readonly<TFormLabel>) {
  if (!label) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-x-2.5', className)}>
      <SCN_FormLabel data-testid={`${name}-error-message`} className='leading-none'>
        {label}
      </SCN_FormLabel>
      {!isRequired && <OptionalBadge />}
    </div>
  );
}
