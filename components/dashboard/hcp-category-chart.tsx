'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const chartConfig = {
  count: {
    label: 'HCPs',
    color: 'var(--chart-4)',
  },
} satisfies ChartConfig;

export function HcpCategoryChart({
  data,
}: {
  data: { category: string; count: number }[];
}) {
  return (
    <ChartContainer
      config={chartConfig}
      className="h-[240px] min-h-[240px] w-full !aspect-auto"
    >
      <BarChart accessibilityLayer data={data} margin={{ left: 4, right: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis
          dataKey="category"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 11 }}
        />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={36} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
