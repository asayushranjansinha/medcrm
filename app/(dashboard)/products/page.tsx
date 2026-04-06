'use client';

import type { ColumnDef, SortingState } from '@tanstack/react-table';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/shared/data-table';
import { DataTableColumnHeader } from '@/components/shared/data-table-column-header';
import { PageHeader } from '@/components/shared/page-header';
import { ExportButton } from '@/components/reports/export-button';
import { buttonVariants } from '@/components/ui/button';
import { EyeIcon } from '@/components/ui/eye';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/hooks/use-products';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Product } from '@/lib/db/schema';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectOptionItems,
  selectItemsRecordFromOptions,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  ACTIVE_STATUS_FILTERS,
  PRODUCT_CATEGORIES,
  PRODUCT_STOCK_FILTERS,
} from '@/lib/constants';
import { Filter } from 'lucide-react';

function selectFilterValue(v: string | null | undefined) {
  if (!v || v === '__all__') return '';
  return v;
}

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);
  const [filters, setFilters] = useState({
    category: '',
    stock: '',
    isActive: '',
  });

  const categoryFilterItems = useMemo(
    () => selectItemsRecordFromOptions([...PRODUCT_CATEGORIES]),
    []
  );
  const stockFilterItems = useMemo(
    () => selectItemsRecordFromOptions([...PRODUCT_STOCK_FILTERS]),
    []
  );
  const activeFilterItems = useMemo(
    () => selectItemsRecordFromOptions([...ACTIVE_STATUS_FILTERS]),
    []
  );

  const sortBy = sorting[0]?.id ?? 'name';
  const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';

  const { data, isLoading } = useProducts({
    page: String(page),
    pageSize: '25',
    search: search || undefined,
    sortBy,
    sortOrder,
    category: filters.category || undefined,
    stock: filters.stock || undefined,
    isActive: filters.isActive || undefined,
  });

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
        cell: ({ row }) => (
          <Link className="text-primary font-medium hover:underline" href={`/products/${row.original.id}`}>
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: 'genericName',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Generic" />,
      },
      {
        accessorKey: 'category',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
      },
      {
        accessorKey: 'mrp',
        header: ({ column }) => <DataTableColumnHeader column={column} title="MRP" />,
        cell: ({ row }) => formatCurrency(row.original.mrp),
      },
      {
        accessorKey: 'stockQty',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Stock" />,
        cell: ({ row }) => {
          const q = row.original.stockQty;
          return (
            <Badge
              variant="secondary"
              className={
                q === 0
                  ? 'bg-red-600/15 text-red-700 dark:text-red-400'
                  : q < 10
                    ? 'bg-amber-500/15 text-amber-800 dark:text-amber-400'
                    : ''
              }
            >
              {q}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'manufacturer',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Manufacturer" />,
      },
      {
        accessorKey: 'expiryDate',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Expiry" />,
        cell: ({ row }) => formatDate(row.original.expiryDate),
      },
      {
        accessorKey: 'isActive',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => (row.original.isActive ? 'Active' : 'Inactive'),
      },
      {
        id: 'actions',
        enableSorting: false,
        cell: ({ row }) => (
          <Link
            href={`/products/${row.original.id}`}
            className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
            aria-label={`View ${row.original.name}`}
            title="View"
          >
            <EyeIcon size={16} className="text-muted-foreground" />
          </Link>
        ),
      },
    ],
    []
  );

  const items = data?.items ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Products" description="Inventory and pricing">
        <ExportButton
          path="/api/exports/products"
          filenamePrefix="products"
          query={{
            search: search || undefined,
            category: filters.category || undefined,
            stock: filters.stock || undefined,
            isActive: filters.isActive || undefined,
            sortBy,
            sortOrder,
          }}
        />
        <Link href="/products/new" className={cn(buttonVariants())}>
          Add product
        </Link>
      </PageHeader>

      <div className="flex flex-wrap gap-2">
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
                <Label>Category</Label>
                <Select
                  value={filters.category || '__all__'}
                  onValueChange={(v) =>
                    setFilters((f) => ({ ...f, category: selectFilterValue(v) }))
                  }
                  items={categoryFilterItems}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__" label="Any">
                      Any
                    </SelectItem>
                    <SelectOptionItems options={PRODUCT_CATEGORIES} />
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Stock</Label>
                <Select
                  value={filters.stock || '__all__'}
                  onValueChange={(v) => setFilters((f) => ({ ...f, stock: selectFilterValue(v) }))}
                  items={stockFilterItems}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__" label="Any">
                      Any
                    </SelectItem>
                    <SelectOptionItems options={[...PRODUCT_STOCK_FILTERS]} />
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Active</Label>
                <Select
                  value={filters.isActive || '__all__'}
                  onValueChange={(v) =>
                    setFilters((f) => ({ ...f, isActive: selectFilterValue(v) }))
                  }
                  items={activeFilterItems}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__" label="Any">
                      Any
                    </SelectItem>
                    <SelectOptionItems options={[...ACTIVE_STATUS_FILTERS]} />
                  </SelectContent>
                </Select>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

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
        searchPlaceholder="Search name, generic, manufacturer…"
        sorting={sorting}
        onSortingChange={(next) => {
          setSorting(next.length ? next : [{ id: 'name', desc: false }]);
          setPage(1);
        }}
      />
    </div>
  );
}
