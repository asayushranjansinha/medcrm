'use client';

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ExportButton } from '@/components/reports/export-button';
import { PageHeader } from '@/components/shared/page-header';
import { TableBodySkeleton } from '@/components/shared/table-body-skeleton';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useFieldPerformance } from '@/hooks/use-performance';
import { cn, formatCurrency } from '@/lib/utils';
import type { PerformanceRow } from '@/lib/services/performance.service';

type SortColumn = Exclude<keyof PerformanceRow, 'id'>;

type SortState = { key: SortColumn; dir: 'asc' | 'desc' };

function compareRows(a: PerformanceRow, b: PerformanceRow, key: SortColumn, dir: 'asc' | 'desc'): number {
  const mul = dir === 'asc' ? 1 : -1;
  const va = a[key];
  const vb = b[key];
  if (typeof va === 'number' && typeof vb === 'number') {
    return (va - vb) * mul;
  }
  const sa = va == null ? '' : String(va);
  const sb = vb == null ? '' : String(vb);
  return sa.localeCompare(sb, undefined, { numeric: true, sensitivity: 'base' }) * mul;
}

function SortHeader({
  column,
  label,
  sort,
  onSort,
  align = 'left',
}: {
  column: SortColumn;
  label: string;
  sort: SortState;
  onSort: (key: SortColumn) => void;
  align?: 'left' | 'right';
}) {
  const active = sort.key === column;
  const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;

  return (
    <TableHead
      className={cn(align === 'right' && 'text-right')}
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
    >
      <div className={cn('flex', align === 'right' ? 'justify-end' : 'justify-start')}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            '-mx-2 h-8 gap-1 px-2 font-medium',
            align === 'right' && 'flex-row-reverse'
          )}
          onClick={() => onSort(column)}
        >
          {label}
          <Icon
            className={cn('size-3.5 shrink-0', active ? 'opacity-80' : 'opacity-40')}
            aria-hidden
          />
        </Button>
      </div>
    </TableHead>
  );
}

export default function PerformancePage() {
  const { data, isLoading, error } = useFieldPerformance();
  const [sort, setSort] = useState<SortState>({ key: 'name', dir: 'asc' });

  const toggleSort = (key: SortColumn) => {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
  };

  const sortedRows = useMemo(() => {
    const list = [...(data ?? [])];
    list.sort((a, b) => compareRows(a, b, sort.key, sort.dir));
    return list;
  }, [data, sort]);

  if (error) {
    return <p className="text-destructive">Failed to load performance.</p>;
  }

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
              <SortHeader column="name" label="Name" sort={sort} onSort={toggleSort} />
              <SortHeader column="role" label="Role" sort={sort} onSort={toggleSort} />
              <SortHeader column="territory" label="Territory" sort={sort} onSort={toggleSort} />
              <SortHeader
                column="targetInr"
                label="Target (INR)"
                sort={sort}
                onSort={toggleSort}
                align="right"
              />
              <SortHeader
                column="achievedInr"
                label="Achieved (INR)"
                sort={sort}
                onSort={toggleSort}
                align="right"
              />
              <SortHeader
                column="achievementPct"
                label="Achievement %"
                sort={sort}
                onSort={toggleSort}
                align="right"
              />
              <SortHeader
                column="visitsThisMonth"
                label="Visits (month)"
                sort={sort}
                onSort={toggleSort}
                align="right"
              />
              <SortHeader
                column="completedVisits"
                label="Completed"
                sort={sort}
                onSort={toggleSort}
                align="right"
              />
              <SortHeader
                column="ordersBooked"
                label="Orders"
                sort={sort}
                onSort={toggleSort}
                align="right"
              />
            </TableRow>
          </TableHeader>
          {isLoading ? (
            <TableBodySkeleton columns={9} rows={8} />
          ) : (
            <TableBody>
              {sortedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-muted-foreground">
                    No employee records yet.
                  </TableCell>
                </TableRow>
              ) : (
                sortedRows.map((r) => (
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
