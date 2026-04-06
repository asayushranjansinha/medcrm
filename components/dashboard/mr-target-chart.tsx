'use client';

import { Bar, BarChart, CartesianGrid, Cell, LabelList, Tooltip, XAxis, YAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
} from '@/components/ui/chart';
import { formatCurrency } from '@/lib/utils';

const chartConfig = {
  target: { label: 'Target', color: '#94A3B8' },
  achieved: { label: 'Achieved', color: '#16A34A' },
} satisfies ChartConfig;

function trimName(name: string, max = 12) {
  if (name.length <= max) return name;
  return `${name.slice(0, max)}…`;
}

function achievedColor(pct: number) {
  if (pct >= 100) return '#16A34A';
  if (pct >= 70) return '#CA8A04';
  return '#DC2626';
}

export function MrTargetChart({
  data,
}: {
  data: { mrName: string; target: number; achieved: number; pct: number }[];
}) {
  if (!data.length) {
    return (
      <div className="flex h-[280px] min-h-[280px] items-center justify-center text-sm text-muted-foreground">
        No MR target data for this month
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: trimName(d.mrName),
    achievedFill: achievedColor(d.pct),
  }));

  return (
    <ChartContainer
      config={chartConfig}
      className="h-[280px] min-h-[280px] w-full !aspect-auto"
    >
      <BarChart
        accessibilityLayer
        data={chartData}
        layout="vertical"
        margin={{ left: 4, right: 48, top: 4, bottom: 4 }}
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
              target: number;
              achieved: number;
              pct: number;
            };
            return (
              <div className="rounded-md border border-border bg-background px-3 py-2 text-xs shadow-md">
                <p className="font-medium">{p.mrName}</p>
                <p className="text-muted-foreground">Target: {formatCurrency(p.target)}</p>
                <p className="text-muted-foreground">Achieved: {formatCurrency(p.achieved)}</p>
                <p className="text-muted-foreground">{p.pct}% of target</p>
              </div>
            );
          }}
        />
        <Bar dataKey="target" name="Target" fill="#94A3B8" radius={[0, 2, 2, 0]} />
        <Bar dataKey="achieved" name="Achieved" radius={[0, 2, 2, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-ach-${entry.mrName}-${index}`} fill={entry.achievedFill} />
          ))}
          <LabelList
            dataKey="achieved"
            position="right"
            className="fill-foreground text-[11px]"
            valueAccessor={(entry) => {
              if (!('payload' in entry) || !entry.payload) return '';
              const pct = (entry.payload as { pct?: number }).pct;
              return pct != null ? `${pct}%` : '';
            }}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
