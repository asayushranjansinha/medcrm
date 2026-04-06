'use client';

import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
} from '@/components/ui/chart';
import { formatCurrency } from '@/lib/utils';

const chartConfig = {
  totalValue: { label: 'Value', color: '#0891B2' },
} satisfies ChartConfig;

function trimStockist(name: string, max = 20) {
  if (name.length <= max) return name;
  return `${name.slice(0, max)}…`;
}

export function TopStockistsChart({
  data,
}: {
  data: { stockistName: string; totalValue: number; totalUnits: number }[];
}) {
  if (!data.length) {
    return (
      <div className="flex h-[260px] min-h-[260px] items-center justify-center text-sm text-muted-foreground">
        No stockist outbound sales this month
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: trimStockist(d.stockistName),
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
        margin={{ left: 8, right: 16, top: 4, bottom: 4 }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
        <YAxis
          type="category"
          dataKey="label"
          width={120}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10 }}
        />
        <Tooltip
          cursor={{ className: 'fill-muted/30' }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0]?.payload as {
              stockistName: string;
              totalValue: number;
              totalUnits: number;
            };
            return (
              <div className="rounded-md border border-border bg-background px-3 py-2 text-xs shadow-md">
                <p className="font-medium">{p.stockistName}</p>
                <p className="text-muted-foreground">Value: {formatCurrency(p.totalValue)}</p>
                <p className="text-muted-foreground">Units: {p.totalUnits}</p>
              </div>
            );
          }}
        />
        <Bar dataKey="totalValue" fill="#0891B2" name="Total value" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
