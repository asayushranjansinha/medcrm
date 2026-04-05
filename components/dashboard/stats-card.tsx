import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

export function StatsCard({
  title,
  value,
  trendPct,
  subtitle,
}: {
  title: string;
  value: string | number;
  trendPct?: number;
  subtitle?: string;
}) {
  const up = trendPct != null && trendPct > 0;
  const down = trendPct != null && trendPct < 0;
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {trendPct != null ? (
          <p
            className={cn(
              'mt-1 flex items-center gap-1 text-xs',
              up && 'text-emerald-600 dark:text-emerald-400',
              down && 'text-red-600 dark:text-red-400',
              !up && !down && 'text-muted-foreground'
            )}
          >
            <Icon className="size-3.5" />
            {trendPct === 0 ? 'No change' : `${trendPct > 0 ? '+' : ''}${trendPct}%`} vs last month
          </p>
        ) : null}
        {subtitle ? <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p> : null}
      </CardContent>
    </Card>
  );
}
