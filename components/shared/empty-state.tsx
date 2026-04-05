import { LucideIcon } from 'lucide-react';

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-16">
      <Icon className="size-10 opacity-50" />
      <p className="font-medium text-foreground">{title}</p>
      {description ? <p className="max-w-sm text-center text-sm">{description}</p> : null}
    </div>
  );
}
