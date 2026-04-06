'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { LowStockAlertTable } from '@/components/dashboard/low-stock-alert-table';
import { MrTargetChart } from '@/components/dashboard/mr-target-chart';
import { MrVisitCompletionChart } from '@/components/dashboard/mr-visit-completion-chart';
import { RecentActivityFeed } from '@/components/dashboard/recent-activity-feed';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { StatsCard } from '@/components/dashboard/stats-card';
import { TerritoryRevenueChart } from '@/components/dashboard/territory-revenue-chart';
import { TopProductsChart } from '@/components/dashboard/top-products-chart';
import { TopStockistsChart } from '@/components/dashboard/top-stockists-chart';
import { VisitActivityChart } from '@/components/dashboard/visit-activity-chart';
import { VisitOutcomeTrendChart } from '@/components/dashboard/visit-outcome-trend-chart';
import { PageHeader } from '@/components/shared/page-header';
import { PageLoader } from '@/components/shared/page-loader';
import { buttonVariants } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboardStats();

  if (error) {
    return <p className="text-destructive">Failed to load dashboard.</p>;
  }

  if (isLoading) {
    return <PageLoader />;
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
        recentActivity: { at: string; label: string; detail: string; actor: string }[];
        lowStockAlerts?: number;
        targetAchievementPctAvg?: number;
        mrTargetVsAchievement: { mrName: string; target: number; achieved: number; pct: number }[];
        mrVisitCompletion: {
          mrName: string;
          planned: number;
          completed: number;
          missed: number;
          completionRate: number;
        }[];
        lowStockStockistLines: {
          stockistName: string;
          productName: string;
          currentQty: number;
          stockistId: string;
        }[];
        topStockists: { stockistName: string; totalValue: number; totalUnits: number }[];
        territoryRevenue: { territory: string; revenue: number }[];
        visitOutcomeTrend: {
          month: string;
          positive: number;
          neutral: number;
          negative: number;
          notMet: number;
        }[];
        prescriptionCommitmentRate: number;
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
          value={s?.totalPersons ?? 0}
          trendPct={s?.trends.totalPersonsPct}
        />
        <StatsCard
          title="Visits this month"
          value={s?.visitsThisMonth ?? 0}
          trendPct={s?.trends.visitsPct}
        />
        <StatsCard
          title="Products dispatched"
          value={s?.dispatchesThisMonth ?? 0}
          trendPct={s?.trends.dispatchesPct}
          subtitle="Units (all types)"
        />
        <StatsCard
          title="Revenue this month"
          value={formatCurrency(s?.revenueThisMonth ?? 0)}
          trendPct={s?.trends.revenuePct}
          subtitle="From completed orders"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatsCard
          title="Low stock alerts"
          value={s?.lowStockAlerts ?? 0}
          subtitle="Stockist lines under 10 units"
        />
        <StatsCard
          title="Target achievement"
          value={`${s?.targetAchievementPctAvg ?? 0}%`}
          subtitle="Avg for MRs, current month"
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

      <div className="grid gap-4 lg:grid-cols-2">
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
        <RecentActivityFeed items={s?.recentActivity ?? []} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Target vs achievement — current month</CardTitle>
        </CardHeader>
        <CardContent>
          <MrTargetChart data={s?.mrTargetVsAchievement ?? []} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">MR visit completion</CardTitle>
          </CardHeader>
          <CardContent>
            <MrVisitCompletionChart data={s?.mrVisitCompletion ?? []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by territory</CardTitle>
          </CardHeader>
          <CardContent>
            <TerritoryRevenueChart data={s?.territoryRevenue ?? []} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top stockists by sales</CardTitle>
          </CardHeader>
          <CardContent>
            <TopStockistsChart data={s?.topStockists ?? []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visit outcome trend — 6 months</CardTitle>
          </CardHeader>
          <CardContent>
            <VisitOutcomeTrendChart data={s?.visitOutcomeTrend ?? []} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Low stock alerts</CardTitle>
            <p className="text-sm text-muted-foreground">Stockist lines under 10 units</p>
          </CardHeader>
          <CardContent>
            <LowStockAlertTable rows={s?.lowStockStockistLines ?? []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prescription commitment rate</CardTitle>
            <p className="text-sm text-muted-foreground">Doctor visits this month</p>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-8">
            <span className="text-6xl font-bold tracking-tight">
              {s?.prescriptionCommitmentRate ?? 0}%
            </span>
            <span className="text-sm text-muted-foreground">
              of completed doctor visits resulted in prescription commitment
            </span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
