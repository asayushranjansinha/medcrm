'use client';

import type { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/shared/data-table';
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
import { PRODUCT_CATEGORIES } from '@/lib/constants';
import { Filter } from 'lucide-react';

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    stock: '',
    isActive: '',
  });

  const { data, isLoading } = useProducts({
    page: String(page),
    pageSize: '25',
    search: search || undefined,
    sortBy: 'name',
    sortOrder: 'asc',
    category: filters.category || undefined,
    stock: filters.stock || undefined,
    isActive: filters.isActive || undefined,
  });

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <Link className="text-primary font-medium hover:underline" href={`/products/${row.original.id}`}>
            {row.original.name}
          </Link>
        ),
      },
      { accessorKey: 'genericName', header: 'Generic' },
      { accessorKey: 'category', header: 'Category' },
      {
        accessorKey: 'mrp',
        header: 'MRP',
        cell: ({ row }) => formatCurrency(row.original.mrp),
      },
      {
        accessorKey: 'stockQty',
        header: 'Stock',
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
      { accessorKey: 'manufacturer', header: 'Manufacturer' },
      {
        accessorKey: 'expiryDate',
        header: 'Expiry',
        cell: ({ row }) => formatDate(row.original.expiryDate),
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (row.original.isActive ? 'Active' : 'Inactive'),
      },
      {
        id: 'actions',
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
            sortBy: 'name',
            sortOrder: 'asc',
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
                    setFilters((f) => ({ ...f, category: v === '__all__' ? '' : v }))
                  }
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
                  onValueChange={(v) => setFilters((f) => ({ ...f, stock: v === '__all__' ? '' : v }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__" label="Any">
                      Any
                    </SelectItem>
                    <SelectItem value="in" label="In stock (≥10)">
                      In stock (≥10)
                    </SelectItem>
                    <SelectItem value="low" label="Low (<10)">
                      Low (&lt;10)
                    </SelectItem>
                    <SelectItem value="out" label="Out (0)">
                      Out (0)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Active</Label>
                <Select
                  value={filters.isActive || '__all__'}
                  onValueChange={(v) =>
                    setFilters((f) => ({ ...f, isActive: v === '__all__' ? '' : v }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__" label="Any">
                      Any
                    </SelectItem>
                    <SelectItem value="true" label="Active">
                      Active
                    </SelectItem>
                    <SelectItem value="false" label="Inactive">
                      Inactive
                    </SelectItem>
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
      />
    </div>
  );
}
