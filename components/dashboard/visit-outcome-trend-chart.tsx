'use client';

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';

const COLORS = ['#2563EB', '#16A34A', '#EA580C', '#9333EA', '#0891B2', '#CA8A04'] as const;

const chartConfig = {
  positive: { label: 'Positive', color: COLORS[1] },
  neutral: { label: 'Neutral', color: '#94A3B8' },
  negative: { label: 'Negative', color: '#DC2626' },
  notMet: { label: 'Not met', color: COLORS[2] },
} satisfies ChartConfig;

export function VisitOutcomeTrendChart({
  data,
}: {
  data: {
    month: string;
    positive: number;
    neutral: number;
    negative: number;
    notMet: number;
  }[];
}) {
  const hasAny = data.some(
    (d) => d.positive + d.neutral + d.negative + d.notMet > 0
  );

  if (!data.length || !hasAny) {
    return (
      <div className="flex h-[260px] min-h-[260px] items-center justify-center text-sm text-muted-foreground">
        No visit outcomes in the last 6 months
      </div>
    );
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="h-[280px] min-h-[280px] w-full !aspect-auto"
    >
      <BarChart
        accessibilityLayer
        data={data}
        margin={{ left: 4, right: 8, top: 4, bottom: 8 }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 11 }}
        />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={36} />
        <Tooltip
          cursor={{ className: 'fill-muted/30' }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const row = payload[0]?.payload as {
              month: string;
              positive: number;
              neutral: number;
              negative: number;
              notMet: number;
            };
            return (
              <div className="rounded-md border border-border bg-background px-3 py-2 text-xs shadow-md">
                <p className="font-medium">{row.month}</p>
                <p className="text-muted-foreground">Positive: {row.positive}</p>
                <p className="text-muted-foreground">Neutral: {row.neutral}</p>
                <p className="text-muted-foreground">Negative: {row.negative}</p>
                <p className="text-muted-foreground">Not met: {row.notMet}</p>
              </div>
            );
          }}
        />
        <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" />
        <Bar dataKey="positive" stackId="o" fill={COLORS[1]} name="Positive" radius={[0, 0, 0, 0]} />
        <Bar dataKey="neutral" stackId="o" fill={chartConfig.neutral.color} name="Neutral" radius={[0, 0, 0, 0]} />
        <Bar dataKey="negative" stackId="o" fill="#DC2626" name="Negative" radius={[0, 0, 0, 0]} />
        <Bar dataKey="notMet" stackId="o" fill={COLORS[2]} name="Not met" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
