import { cn } from '@/lib/utils';

type TOptionalBadge = {
  className?: string;
};

export default function OptionalBadge({ className }: Readonly<TOptionalBadge>) {
  return (
    <span className={cn('text-muted-foreground mt-auto ml-auto text-xs', className)}>Optional</span>
  );
}
