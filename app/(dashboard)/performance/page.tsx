'use client';

import { ExportButton } from '@/components/reports/export-button';
import { PageHeader } from '@/components/shared/page-header';
import { TableBodySkeleton } from '@/components/shared/table-body-skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useFieldPerformance } from '@/hooks/use-performance';
import { formatCurrency } from '@/lib/utils';

export default function PerformancePage() {
  const { data, isLoading, error } = useFieldPerformance();

  if (error) {
    return <p className="text-destructive">Failed to load performance.</p>;
  }

  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field performance"
        description="Monthly targets, achievement, and visit activity"
      >
        <ExportButton path="/api/exports/performance" filenamePrefix="performance" query={{}} />
      </PageHeader>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Territory</TableHead>
              <TableHead className="text-right">Target (INR)</TableHead>
              <TableHead className="text-right">Achieved (INR)</TableHead>
              <TableHead className="text-right">Achievement %</TableHead>
              <TableHead className="text-right">Visits (month)</TableHead>
              <TableHead className="text-right">Completed</TableHead>
              <TableHead className="text-right">Orders</TableHead>
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <TableBodySkeleton columns={9} rows={8} />
          ) : (
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-muted-foreground">
                  No employee records yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.role ?? '—'}</TableCell>
                  <TableCell>{r.territory ?? '—'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.targetInr)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(r.achievedInr)}</TableCell>
                  <TableCell className="text-right">{r.achievementPct}%</TableCell>
                  <TableCell className="text-right">{r.visitsThisMonth}</TableCell>
                  <TableCell className="text-right">{r.completedVisits}</TableCell>
                  <TableCell className="text-right">{r.ordersBooked}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          )}
        </Table>
      </div>
    </div>
  );
}
