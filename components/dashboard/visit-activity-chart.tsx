'use client';

import { Cell, Pie, PieChart } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const chartConfig = {
  Planned: {
    label: 'Planned',
    color: 'var(--chart-1)',
  },
  Completed: {
    label: 'Completed',
    color: 'var(--chart-2)',
  },
  Cancelled: {
    label: 'Cancelled',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig;

export function VisitActivityChart({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  const chartData = data.map((row) => ({
    ...row,
    fill: `var(--color-${row.name})`,
  }));

  return (
    <ChartContainer
      config={chartConfig}
      className="h-[260px] min-h-[260px] w-full !aspect-auto"
    >
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${entry.name}-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
      </PieChart>
    </ChartContainer>
  );
}
