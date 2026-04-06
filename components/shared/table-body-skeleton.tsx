'use client';

import { OrbitalLoader } from '@/components/ui/orbital-loader';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';

type TableBodySkeletonProps = {
  columns: number;
  /** Kept for API compatibility; table shows a single centered loader row. */
  rows?: number;
};

export function TableBodySkeleton({ columns }: TableBodySkeletonProps) {
  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={columns} className="h-48 align-middle">
          <div className="flex justify-center py-6">
            <OrbitalLoader message="Loading…" />
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  );
}
