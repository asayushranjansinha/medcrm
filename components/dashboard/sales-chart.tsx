'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const chartConfig = {
  visitCount: {
    label: 'Visits',
    color: 'var(--chart-1)',
  },
  orderValue: {
    label: 'Order value',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

export function SalesChart({
  data,
}: {
  data: { month: string; visitCount: number; orderValue: number }[];
}) {
  return (
    <ChartContainer
      config={chartConfig}
      className="h-[280px] min-h-[280px] w-full !aspect-auto"
    >
      <LineChart accessibilityLayer data={data} margin={{ left: 4, right: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          yAxisId="left"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          width={36}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          width={44}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="visitCount"
          stroke="var(--color-visitCount)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="orderValue"
          stroke="var(--color-orderValue)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
