'use client';

import type { ColumnDef, SortingState } from '@tanstack/react-table';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/shared/data-table';
import { DataTableColumnHeader } from '@/components/shared/data-table-column-header';
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
  SelectOptionItems,
  selectItemsRecordFromOptions,
  selectItemsRecordFromPairs,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DISPATCH_TYPES, DISPATCH_STATUSES, MOVEMENT_TYPES } from '@/lib/constants';
import { useUsers } from '@/hooks/use-users';
import { useProducts } from '@/hooks/use-products';
import { usePersons } from '@/hooks/use-persons';
import { Filter } from 'lucide-react';

function selectFilterValue(v: string | null | undefined) {
  if (!v || v === '__all__') return '';
  return v;
}

export default function DispatchesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'dispatchDate', desc: true }]);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    productId: '',
    personId: '',
    dispatchType: '',
    movementType: '',
    status: '',
    userId: '',
  });
  const { data: users } = useUsers();
  const { data: products } = useProducts({ page: '1', pageSize: '100', sortBy: 'name', sortOrder: 'asc' });
  const { data: persons } = usePersons({ page: '1', pageSize: '100', sortBy: 'name', sortOrder: 'asc' });

  const productFilterItems = useMemo(
    () =>
      selectItemsRecordFromPairs(
        (products?.items ?? []).map((p) => ({ id: p.id, label: p.name }))
      ),
    [products?.items]
  );
  const personFilterItems = useMemo(
    () =>
      selectItemsRecordFromPairs(
        (persons?.items ?? []).map((p) => ({ id: p.id, label: p.name }))
      ),
    [persons?.items]
  );
  const userFilterItems = useMemo(
    () => selectItemsRecordFromPairs((users ?? []).map((u) => ({ id: u.id, label: u.name }))),
    [users]
  );
  const movementFilterItems = useMemo(
    () => selectItemsRecordFromOptions([...MOVEMENT_TYPES]),
    []
  );
  const dispatchTypeFilterItems = useMemo(
    () => selectItemsRecordFromOptions([...DISPATCH_TYPES]),
    []
  );
  const dispatchStatusFilterItems = useMemo(
    () => selectItemsRecordFromOptions([...DISPATCH_STATUSES]),
    []
  );

  const sortBy = sorting[0]?.id ?? 'dispatchDate';
  const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';

  const { data, isLoading } = useDispatches({
    page: String(page),
    pageSize: '25',
    search: search || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    productId: filters.productId || undefined,
    personId: filters.personId || undefined,
    dispatchType: filters.dispatchType || undefined,
    movementType: filters.movementType || undefined,
    status: filters.status || undefined,
    userId: filters.userId || undefined,
    sortBy,
    sortOrder,
  });

  const columns = useMemo<ColumnDef<DispatchRow>[]>(
    () => [
      {
        accessorKey: 'productName',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
      },
      {
        accessorKey: 'personName',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Recipient" />,
      },
      {
        accessorKey: 'dispatchedByName',
        header: ({ column }) => <DataTableColumnHeader column={column} title="By" />,
      },
      {
        accessorKey: 'movementType',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Movement" />,
      },
      {
        accessorKey: 'dispatchType',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
      },
      {
        accessorKey: 'quantity',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Qty" />,
      },
      {
        accessorKey: 'dispatchDate',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
        cell: ({ row }) => formatDate(row.original.dispatchDate),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <DispatchStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'invoiceNumber',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice" />,
        cell: ({ row }) => row.original.invoiceNumber ?? '—',
      },
      {
        accessorKey: 'totalValue',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Value" />,
        cell: ({ row }) => formatCurrency(row.original.totalValue),
      },
    ],
    []
  );

  const items = data?.items ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Stock movements" description="Inventory transfers and dispatches">
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
            movementType: filters.movementType || undefined,
            status: filters.status || undefined,
            userId: filters.userId || undefined,
            sortBy,
            sortOrder,
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
                onValueChange={(v) => setFilters((f) => ({ ...f, productId: selectFilterValue(v) }))}
                items={productFilterItems}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="__all__" label="Any">
                    Any
                  </SelectItem>
                  {(products?.items ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id} label={p.name}>
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
                onValueChange={(v) => setFilters((f) => ({ ...f, personId: selectFilterValue(v) }))}
                items={personFilterItems}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="__all__" label="Any">
                    Any
                  </SelectItem>
                  {(persons?.items ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id} label={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Movement</Label>
              <Select
                value={filters.movementType || '__all__'}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, movementType: selectFilterValue(v) }))
                }
                items={movementFilterItems}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="__all__" label="Any">
                    Any
                  </SelectItem>
                  <SelectOptionItems options={MOVEMENT_TYPES} />
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={filters.dispatchType || '__all__'}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, dispatchType: selectFilterValue(v) }))
                }
                items={dispatchTypeFilterItems}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__" label="Any">
                    Any
                  </SelectItem>
                  <SelectOptionItems options={DISPATCH_TYPES} />
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={filters.status || '__all__'}
                onValueChange={(v) => setFilters((f) => ({ ...f, status: selectFilterValue(v) }))}
                items={dispatchStatusFilterItems}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__" label="Any">
                    Any
                  </SelectItem>
                  <SelectOptionItems options={DISPATCH_STATUSES} />
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>MR</Label>
              <Select
                value={filters.userId || '__all__'}
                onValueChange={(v) => setFilters((f) => ({ ...f, userId: selectFilterValue(v) }))}
                items={userFilterItems}
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
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Search product, HCP, city, MR, invoice, status…"
        sorting={sorting}
        onSortingChange={(next) => {
          setSorting(next);
          setPage(1);
        }}
        getRowId={(row) => row.id}
      />
    </div>
  );
}
