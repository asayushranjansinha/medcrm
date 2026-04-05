'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { HcpCategoryChart } from '@/components/dashboard/hcp-category-chart';
import { RecentActivityFeed } from '@/components/dashboard/recent-activity-feed';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { StatsCard } from '@/components/dashboard/stats-card';
import { TopProductsChart } from '@/components/dashboard/top-products-chart';
import { VisitActivityChart } from '@/components/dashboard/visit-activity-chart';
import { PageHeader } from '@/components/shared/page-header';
import { buttonVariants } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboardStats();

  if (error) {
    return <p className="text-destructive">Failed to load dashboard.</p>;
  }

  const s = data as
    | {
        totalPersons: number;
        visitsThisMonth: number;
        dispatchesThisMonth: number;
        revenueThisMonth: number;
        trends: {
          totalPersonsPct: number;
          visitsPct: number;
          dispatchesPct: number;
          revenuePct: number;
        };
        monthlySalesTrend: { month: string; visitCount: number; orderValue: number }[];
        topProducts: { name: string; totalQty: number }[];
        visitStatusBreakdown: Record<string, number>;
        hcpCategoryDistribution: Record<string, number>;
        recentActivity: { at: string; label: string; detail: string; actor: string }[];
      }
    | undefined;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Sales dashboard"
        description="Territory performance at a glance"
      >
        <Link
          href="/visits/new"
          className={cn(buttonVariants({ size: 'sm' }), 'inline-flex gap-1')}
        >
          <Plus className="size-4" />
          Log visit
        </Link>
        <Link
          href="/dispatches/new"
          className={cn(buttonVariants({ size: 'sm', variant: 'secondary' }))}
        >
          New dispatch
        </Link>
        <Link
          href="/persons/new"
          className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
        >
          Add HCP
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Total HCPs"
          value={isLoading ? '—' : (s?.totalPersons ?? 0)}
          trendPct={s?.trends.totalPersonsPct}
        />
        <StatsCard
          title="Visits this month"
          value={isLoading ? '—' : (s?.visitsThisMonth ?? 0)}
          trendPct={s?.trends.visitsPct}
        />
        <StatsCard
          title="Products dispatched"
          value={isLoading ? '—' : (s?.dispatchesThisMonth ?? 0)}
          trendPct={s?.trends.dispatchesPct}
          subtitle="Units (all types)"
        />
        <StatsCard
          title="Revenue this month"
          value={isLoading ? '—' : formatCurrency(s?.revenueThisMonth ?? 0)}
          trendPct={s?.trends.revenuePct}
          subtitle="From completed orders"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly sales trend</CardTitle>
          </CardHeader>
          <CardContent>{s?.monthlySalesTrend ? <SalesChart data={s.monthlySalesTrend} /> : null}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top products by dispatch</CardTitle>
          </CardHeader>
          <CardContent>
            {s?.topProducts?.length ? (
              <TopProductsChart
                data={s.topProducts.map((p) => ({ name: p.name.slice(0, 18), totalQty: p.totalQty }))}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visit status</CardTitle>
          </CardHeader>
          <CardContent>
            {s?.visitStatusBreakdown ? (
              <VisitActivityChart
                data={[
                  { name: 'Planned', value: s.visitStatusBreakdown.PLANNED ?? 0 },
                  { name: 'Completed', value: s.visitStatusBreakdown.COMPLETED ?? 0 },
                  { name: 'Cancelled', value: s.visitStatusBreakdown.CANCELLED ?? 0 },
                ]}
              />
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">HCP category</CardTitle>
          </CardHeader>
          <CardContent>
            {s?.hcpCategoryDistribution ? (
              <HcpCategoryChart
                data={Object.entries(s.hcpCategoryDistribution).map(([category, count]) => ({
                  category,
                  count,
                }))}
              />
            ) : null}
          </CardContent>
        </Card>
        <RecentActivityFeed items={s?.recentActivity ?? []} />
      </div>
    </div>
  );
}
