'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function qtyBadge(qty: number) {
  if (qty <= 0)
    return (
      <Badge variant="destructive" className="font-normal">
        Out of stock
      </Badge>
    );
  if (qty <= 4)
    return (
      <Badge variant="destructive" className="font-normal">
        Critical
      </Badge>
    );
  return (
    <Badge className="border-transparent bg-orange-500/15 font-normal text-orange-700 dark:text-orange-400">
      Low
    </Badge>
  );
}

export function LowStockAlertTable({
  rows,
}: {
  rows: { stockistName: string; productName: string; currentQty: number; stockistId: string }[];
}) {
  if (!rows.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Check className="size-8 text-green-600" aria-hidden />
        <span>All stockists adequately stocked</span>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Stockist</TableHead>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={`${row.stockistId}-${row.productName}`}>
            <TableCell className="font-medium">
              <Link
                href={`/stockists/${row.stockistId}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                {row.stockistName}
              </Link>
            </TableCell>
            <TableCell>{row.productName}</TableCell>
            <TableCell className="text-right tabular-nums">{row.currentQty}</TableCell>
            <TableCell>{qtyBadge(row.currentQty)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
