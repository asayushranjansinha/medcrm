'use client';

import type { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { ExportButton } from '@/components/reports/export-button';
import { VisitStatusBadge } from '@/components/shared/status-badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useVisits, type VisitRow } from '@/hooks/use-visits';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectOptionItems,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VISIT_PURPOSES, VISIT_STATUSES } from '@/lib/constants';
import { useUsers } from '@/hooks/use-users';
import { Filter } from 'lucide-react';

export default function VisitsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    userId: '',
    purpose: '',
    status: '',
    city: '',
  });
  const { data: users } = useUsers();

  const { data, isLoading } = useVisits({
    page: String(page),
    pageSize: '25',
    search: search || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    userId: filters.userId || undefined,
    purpose: filters.purpose || undefined,
    status: filters.status || undefined,
    city: filters.city || undefined,
    sortBy: 'visitDate',
    sortOrder: 'desc',
  });

  const columns = useMemo<ColumnDef<VisitRow>[]>(
    () => [
      { accessorKey: 'personName', header: 'HCP' },
      { accessorKey: 'personCity', header: 'City' },
      { accessorKey: 'mrName', header: 'MR' },
      {
        accessorKey: 'visitDate',
        header: 'Date',
        cell: ({ row }) => formatDate(row.original.visitDate),
      },
      { accessorKey: 'purpose', header: 'Purpose' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <VisitStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'orderTaken',
        header: 'Order',
        cell: ({ row }) => (row.original.orderTaken ? 'Yes' : 'No'),
      },
      {
        accessorKey: 'orderValue',
        header: 'Value',
        cell: ({ row }) => formatCurrency(row.original.orderValue),
      },
      {
        accessorKey: 'nextVisitDate',
        header: 'Next',
        cell: ({ row }) => formatDate(row.original.nextVisitDate),
      },
    ],
    []
  );

  const items = data?.items ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Visit log" description="Field activity and orders">
        <ExportButton
          path="/api/exports/visits"
          filenamePrefix="visits"
          query={{
            search: search || undefined,
            dateFrom: filters.dateFrom || undefined,
            dateTo: filters.dateTo || undefined,
            userId: filters.userId || undefined,
            purpose: filters.purpose || undefined,
            status: filters.status || undefined,
            city: filters.city || undefined,
            sortBy: 'visitDate',
            sortOrder: 'desc',
          }}
        />
        <Link href="/visits/new" className={cn(buttonVariants())}>
          Log visit
        </Link>
      </PageHeader>

      <Sheet>
        <SheetTrigger
          type="button"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          <Filter className="size-4" />
          Filters
        </SheetTrigger>
        <SheetContent className="flex flex-col overflow-hidden">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pt-1">
            <div>
              <Label>From</Label>
              <Input
                type="date"
                className="mt-1"
                value={filters.dateFrom}
                onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
              />
            </div>
            <div>
              <Label>To</Label>
              <Input
                type="date"
                className="mt-1"
                value={filters.dateTo}
                onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
              />
            </div>
            <div>
              <Label>MR</Label>
              <Select
                value={filters.userId || '__all__'}
                onValueChange={(v) => setFilters((f) => ({ ...f, userId: v === '__all__' ? '' : v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__" label="Any">
                    Any
                  </SelectItem>
                  {(users ?? []).map((u) => (
                    <SelectItem key={u.id} value={u.id} label={u.name}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Purpose</Label>
              <Select
                value={filters.purpose || '__all__'}
                onValueChange={(v) => setFilters((f) => ({ ...f, purpose: v === '__all__' ? '' : v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__" label="Any">
                    Any
                  </SelectItem>
                  <SelectOptionItems options={VISIT_PURPOSES} />
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={filters.status || '__all__'}
                onValueChange={(v) => setFilters((f) => ({ ...f, status: v === '__all__' ? '' : v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__" label="Any">
                    Any
                  </SelectItem>
                  <SelectOptionItems options={VISIT_STATUSES} />
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>City contains</Label>
              <Input
                className="mt-1"
                value={filters.city}
                onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        page={page}
        pageSize={25}
        total={total}
        onPageChange={setPage}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search HCP, MR…"
      />
    </div>
  );
}
