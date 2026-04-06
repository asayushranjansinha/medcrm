'use client';

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
} from '@/components/ui/chart';

const chartConfig = {
  completed: { label: 'Completed', color: '#16A34A' },
  missed: { label: 'Missed', color: '#DC2626' },
  openPlanned: { label: 'Planned', color: '#94A3B8' },
} satisfies ChartConfig;

export function MrVisitCompletionChart({
  data,
}: {
  data: {
    mrName: string;
    planned: number;
    completed: number;
    missed: number;
    completionRate: number;
  }[];
}) {
  if (!data.length) {
    return (
      <div className="flex h-[260px] min-h-[260px] items-center justify-center text-sm text-muted-foreground">
        No visit data this month
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: d.mrName.length > 14 ? `${d.mrName.slice(0, 14)}…` : d.mrName,
    openPlanned: Math.max(0, d.planned - d.completed - d.missed),
  }));

  return (
    <ChartContainer
      config={chartConfig}
      className="h-[260px] min-h-[260px] w-full !aspect-auto"
    >
      <BarChart
        accessibilityLayer
        data={chartData}
        layout="vertical"
        margin={{ left: 4, right: 16, top: 4, bottom: 4 }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
        <YAxis
          type="category"
          dataKey="label"
          width={88}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
        />
        <Tooltip
          cursor={{ className: 'fill-muted/30' }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0]?.payload as {
              mrName: string;
              planned: number;
              completed: number;
              missed: number;
              completionRate: number;
            };
            return (
              <div className="rounded-md border border-border bg-background px-3 py-2 text-xs shadow-md">
                <p className="font-medium">{p.mrName}</p>
                <p className="text-muted-foreground">Planned (total): {p.planned}</p>
                <p className="text-muted-foreground">Completed: {p.completed}</p>
                <p className="text-muted-foreground">Missed: {p.missed}</p>
                <p className="text-muted-foreground">Completion: {p.completionRate}%</p>
              </div>
            );
          }}
        />
        <Bar dataKey="openPlanned" stackId="a" fill="#94A3B8" name="Planned" radius={[0, 0, 0, 0]} />
        <Bar dataKey="missed" stackId="a" fill="#DC2626" name="Missed" radius={[0, 0, 0, 0]} />
        <Bar dataKey="completed" stackId="a" fill="#16A34A" name="Completed" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
