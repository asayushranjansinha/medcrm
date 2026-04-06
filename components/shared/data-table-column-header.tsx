'use client';

import type { Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type DataTableColumnHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
};

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <span className={cn('font-medium', className)}>{title}</span>;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn('-ml-3 h-8 gap-1 px-3 font-medium', className)}
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {title}
      {column.getIsSorted() === 'desc' ? (
        <ArrowDown className="size-3.5 opacity-70" aria-hidden />
      ) : column.getIsSorted() === 'asc' ? (
        <ArrowUp className="size-3.5 opacity-70" aria-hidden />
      ) : (
        <ArrowUpDown className="size-3.5 opacity-40" aria-hidden />
      )}
    </Button>
  );
}
