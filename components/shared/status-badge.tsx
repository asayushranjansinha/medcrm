import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const visitMap = {
  PLANNED: 'bg-blue-600/15 text-blue-700 dark:text-blue-400',
  COMPLETED: 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-400',
  CANCELLED: 'bg-red-600/15 text-red-700 dark:text-red-400',
} as const;

const dispatchMap = {
  PENDING: 'bg-amber-500/15 text-amber-800 dark:text-amber-400',
  DISPATCHED: 'bg-blue-600/15 text-blue-700 dark:text-blue-400',
  DELIVERED: 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-400',
  RETURNED: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-red-600/15 text-red-700 dark:text-red-400',
} as const;

export function VisitStatusBadge({ status }: { status: keyof typeof visitMap }) {
  return (
    <Badge variant="secondary" className={cn('font-normal', visitMap[status])}>
      {status.replace('_', ' ')}
    </Badge>
  );
}

export function DispatchStatusBadge({ status }: { status: keyof typeof dispatchMap }) {
  return (
    <Badge variant="secondary" className={cn('font-normal', dispatchMap[status])}>
      {status.replace('_', ' ')}
    </Badge>
  );
}
