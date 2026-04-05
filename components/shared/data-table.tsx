'use client';

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type RowSelectionState,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import { Inbox } from 'lucide-react';

type DataTableProps<T> = {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  isLoading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  enableRowSelection?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (s: RowSelectionState) => void;
  getRowId?: (row: T) => string;
  manualSorting?: boolean;
  sorting?: SortingState;
  onSortingChange?: (s: SortingState) => void;
};

export function DataTable<T>({
  columns,
  data,
  isLoading,
  page,
  pageSize,
  total,
  onPageChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  enableRowSelection,
  rowSelection,
  onRowSelectionChange,
  getRowId,
  manualSorting = true,
  sorting: sortingProp,
  onSortingChange,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>(sortingProp ?? []);
  const [localSearch, setLocalSearch] = useState(searchValue ?? '');

  useEffect(() => {
    if (searchValue !== undefined) setLocalSearch(searchValue);
  }, [searchValue]);

  useEffect(() => {
    if (!onSearchChange) return;
    const t = setTimeout(() => onSearchChange(localSearch), 300);
    return () => clearTimeout(t);
  }, [localSearch, onSearchChange]);

  const selectionColumn: ColumnDef<T, unknown> | null = enableRowSelection
    ? {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            aria-label="Select row"
          />
        ),
        size: 40,
      }
    : null;

  const table = useReactTable({
    data,
    columns: selectionColumn ? [selectionColumn, ...columns] : columns,
    state: {
      sorting: sortingProp ?? sorting,
      rowSelection: rowSelection ?? {},
    },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sortingProp ?? sorting) : updater;
      if (onSortingChange) onSortingChange(next);
      else setSorting(next);
    },
    onRowSelectionChange: onRowSelectionChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    manualSorting,
    manualPagination: true,
    pageCount: Math.ceil(total / pageSize) || 1,
    getRowId: getRowId as (row: T) => string | undefined,
  });

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      {onSearchChange ? (
        <Input
          placeholder={searchPlaceholder}
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="max-w-sm"
        />
      ) : null}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id} className="whitespace-nowrap">
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: columns.length + (enableRowSelection ? 1 : 0) }).map(
                      (_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      )
                    )}
                  </TableRow>
                ))
              : null}
            {!isLoading && data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (enableRowSelection ? 1 : 0)}
                  className="h-48"
                >
                  <EmptyState icon={Inbox} title="No results" description="Try adjusting filters." />
                </TableCell>
              </TableRow>
            ) : null}
            {!isLoading &&
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          {total === 0 ? '0' : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)}`} of{' '}
          {total}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm">
            Page {page} / {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
