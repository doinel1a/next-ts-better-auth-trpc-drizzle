import { cn } from 'cn';

import { FormLabel as SCN_FormLabel } from '@/components/ui/form';

import OptionalBadge from './optional-badge';

type TFormLabel = Readonly<{
  name: string;
  label?: string;
  isRequired?: boolean;
  className?: string;
}>;

export default function FormLabel({ name, label, isRequired, className }: TFormLabel) {
  if (label === undefined || label === '') {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-x-2.5', className)}>
      <SCN_FormLabel data-testid={`${name}-label`} className='leading-none'>
        {label}
      </SCN_FormLabel>
      {!isRequired && <OptionalBadge />}
    </div>
  );
}
