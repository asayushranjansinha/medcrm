'use client';

import type { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { ExportButton } from '@/components/reports/export-button';
import { DispatchStatusBadge } from '@/components/shared/status-badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDispatches, type DispatchRow } from '@/hooks/use-dispatches';
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
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DISPATCH_TYPES, DISPATCH_STATUSES } from '@/lib/constants';
import { useUsers } from '@/hooks/use-users';
import { useProducts } from '@/hooks/use-products';
import { usePersons } from '@/hooks/use-persons';
import { Filter } from 'lucide-react';

export default function DispatchesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    productId: '',
    personId: '',
    dispatchType: '',
    status: '',
    userId: '',
  });
  const { data: users } = useUsers();
  const { data: products } = useProducts({ page: '1', pageSize: '100', sortBy: 'name', sortOrder: 'asc' });
  const { data: persons } = usePersons({ page: '1', pageSize: '100', sortBy: 'name', sortOrder: 'asc' });

  const { data, isLoading } = useDispatches({
    page: String(page),
    pageSize: '25',
    search: search || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    productId: filters.productId || undefined,
    personId: filters.personId || undefined,
    dispatchType: filters.dispatchType || undefined,
    status: filters.status || undefined,
    userId: filters.userId || undefined,
    sortBy: 'dispatchDate',
    sortOrder: 'desc',
  });

  const columns = useMemo<ColumnDef<DispatchRow>[]>(
    () => [
      { accessorKey: 'productName', header: 'Product' },
      { accessorKey: 'personName', header: 'Recipient' },
      { accessorKey: 'dispatchedByName', header: 'By' },
      { accessorKey: 'dispatchType', header: 'Type' },
      { accessorKey: 'quantity', header: 'Qty' },
      {
        accessorKey: 'dispatchDate',
        header: 'Date',
        cell: ({ row }) => formatDate(row.original.dispatchDate),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <DispatchStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'invoiceNumber',
        header: 'Invoice',
        cell: ({ row }) => row.original.invoiceNumber ?? '—',
      },
      {
        accessorKey: 'totalValue',
        header: 'Value',
        cell: ({ row }) => formatCurrency(row.original.totalValue),
      },
    ],
    []
  );

  const items = data?.items ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Dispatches" description="Samples, sales, and transfers">
        <ExportButton
          path="/api/exports/dispatches"
          filenamePrefix="dispatches"
          query={{
            search: search || undefined,
            dateFrom: filters.dateFrom || undefined,
            dateTo: filters.dateTo || undefined,
            productId: filters.productId || undefined,
            personId: filters.personId || undefined,
            dispatchType: filters.dispatchType || undefined,
            status: filters.status || undefined,
            userId: filters.userId || undefined,
            sortBy: 'dispatchDate',
            sortOrder: 'desc',
          }}
        />
        <Link href="/dispatches/new" className={cn(buttonVariants())}>
          New dispatch
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
              <Label>Product</Label>
              <Select
                value={filters.productId || '__all__'}
                onValueChange={(v) => setFilters((f) => ({ ...f, productId: v === '__all__' ? '' : v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="__all__">Any</SelectItem>
                  {(products?.items ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>HCP</Label>
              <Select
                value={filters.personId || '__all__'}
                onValueChange={(v) => setFilters((f) => ({ ...f, personId: v === '__all__' ? '' : v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="__all__">Any</SelectItem>
                  {(persons?.items ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={filters.dispatchType || '__all__'}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, dispatchType: v === '__all__' ? '' : v }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Any</SelectItem>
                  {DISPATCH_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
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
                  <SelectItem value="__all__">Any</SelectItem>
                  {DISPATCH_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  <SelectItem value="__all__">Any</SelectItem>
                  {(users ?? []).map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        searchPlaceholder="Search product, HCP, MR…"
      />
    </div>
  );
}
