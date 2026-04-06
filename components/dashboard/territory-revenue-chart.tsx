'use client';

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
} from '@/components/ui/chart';
import { formatCurrency } from '@/lib/utils';

const chartConfig = {
  revenue: { label: 'Revenue', color: '#2563EB' },
} satisfies ChartConfig;

function compactInr(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);
}

export function TerritoryRevenueChart({
  data,
}: {
  data: { territory: string; revenue: number }[];
}) {
  if (!data.length) {
    return (
      <div className="flex h-[260px] min-h-[260px] items-center justify-center text-sm text-muted-foreground">
        No territory revenue this month
      </div>
    );
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="h-[260px] min-h-[260px] w-full !aspect-auto"
    >
      <BarChart
        accessibilityLayer
        data={data}
        margin={{ left: 4, right: 8, top: 4, bottom: 4 }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis
          dataKey="territory"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 11 }}
          interval={0}
          angle={-28}
          textAnchor="end"
          height={64}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          width={52}
          tickFormatter={(v) => compactInr(Number(v))}
        />
        <Tooltip
          cursor={{ className: 'fill-muted/30' }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0]?.payload as { territory: string; revenue: number };
            return (
              <div className="rounded-md border border-border bg-background px-3 py-2 text-xs shadow-md">
                <p className="font-medium">{row.territory}</p>
                <p className="text-muted-foreground">{formatCurrency(row.revenue)}</p>
              </div>
            );
          }}
        />
        <Bar dataKey="revenue" fill="#2563EB" name="Revenue" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
