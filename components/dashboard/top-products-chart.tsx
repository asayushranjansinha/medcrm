'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const chartConfig = {
  totalQty: {
    label: 'Units',
    color: 'var(--primary)',
  },
} satisfies ChartConfig;

export function TopProductsChart({
  data,
}: {
  data: { name: string; totalQty: number }[];
}) {
  return (
    <ChartContainer
      config={chartConfig}
      className="h-[260px] min-h-[260px] w-full !aspect-auto"
    >
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{ left: 8, right: 16 }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
        <YAxis
          type="category"
          dataKey="name"
          width={100}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10 }}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="totalQty" fill="var(--color-totalQty)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
