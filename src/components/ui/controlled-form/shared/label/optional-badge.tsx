import { cn } from '@/lib/utils';

type TOptionalBadge = Readonly<{
  className?: string;
}>;

export default function OptionalBadge({ className }: TOptionalBadge) {
  return (
    <span className={cn('text-muted-foreground mt-auto ml-auto text-xs', className)}>Optional</span>
  );
}
