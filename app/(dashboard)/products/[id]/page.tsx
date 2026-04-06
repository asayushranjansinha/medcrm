'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { PageLoader } from '@/components/shared/page-loader';
import { TableBodySkeleton } from '@/components/shared/table-body-skeleton';
import { ProductForm } from '@/components/products/product-form';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useProduct, useUpdateProduct } from '@/hooks/use-products';
import { useDispatches } from '@/hooks/use-dispatches';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Pencil } from 'lucide-react';
import type { UpdateProductInput } from '@/lib/validations/product';

const TerritoryChart = dynamic(
  () => import('@/components/products/territory-chart').then((m) => m.TerritoryChart),
  { ssr: false, loading: () => <PageLoader variant="inline" message="" /> }
);

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [editing, setEditing] = useState(false);
  const { data: product, isLoading } = useProduct(id);
  const update = useUpdateProduct(id);
  const { data: dispatchesData, isPending: dispatchesPending } = useDispatches({
    productId: id,
    pageSize: '500',
  });

  const territoryData = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of dispatchesData?.items ?? []) {
      const key = d.personCity ?? 'Unknown';
      m.set(key, (m.get(key) ?? 0) + d.quantity);
    }
    return [...m.entries()].map(([name, totalQty]) => ({ name, totalQty })).slice(0, 12);
  }, [dispatchesData]);

  if (isLoading) return <PageLoader />;
  if (!product) return <p className="text-muted-foreground">Product not found.</p>;

  const movementRows = [...(dispatchesData?.items ?? [])].sort(
    (a, b) => new Date(a.dispatchDate).getTime() - new Date(b.dispatchDate).getTime()
  );

  return (
    <div className="space-y-6">
      <PageHeader title={product.name} description={product.genericName}>
        <Link
          href="/products"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          Back
        </Link>
        <Button variant="secondary" size="sm" onClick={() => setEditing((e) => !e)}>
          <Pencil className="size-4" />
          {editing ? 'Cancel' : 'Edit'}
        </Button>
      </PageHeader>

      {editing ? (
        <ProductForm
          defaultValues={product}
          submitLabel="Save"
          redirectAfter={false}
          onSubmit={async (data) => {
            await update.mutateAsync(data as UpdateProductInput);
            setEditing(false);
          }}
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-xs font-medium">MRP / PTR</CardTitle>
              </CardHeader>
              <CardContent className="text-lg font-semibold">
                {formatCurrency(product.mrp)} / {formatCurrency(product.ptr)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-xs font-medium">Stock</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{product.stockQty}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-xs font-medium">Expiry</CardTitle>
              </CardHeader>
              <CardContent className="text-lg font-medium">{formatDate(product.expiryDate)}</CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dispatch by city</CardTitle>
            </CardHeader>
            <CardContent>
              {territoryData.length ? <TerritoryChart data={territoryData} /> : (
                <p className="text-muted-foreground text-sm">No dispatches yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dispatch history</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                {dispatchesPending ? (
                  <TableBodySkeleton columns={5} rows={6} />
                ) : (
                  <TableBody>
                    {(dispatchesData?.items ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-muted-foreground">
                          No dispatches yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (dispatchesData?.items ?? []).map((d) => (
                        <TableRow key={d.id}>
                          <TableCell>{d.personName}</TableCell>
                          <TableCell>{d.personCity}</TableCell>
                          <TableCell>{d.quantity}</TableCell>
                          <TableCell>{formatDate(d.dispatchDate)}</TableCell>
                          <TableCell>{d.status}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                )}
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stock movement log</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Recipient</TableHead>
                  </TableRow>
                </TableHeader>
                {dispatchesPending ? (
                  <TableBodySkeleton columns={4} rows={6} />
                ) : (
                  <TableBody>
                    {movementRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground">
                          No movements yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      movementRows.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell>{formatDate(m.dispatchDate)}</TableCell>
                          <TableCell>{m.dispatchType}</TableCell>
                          <TableCell>{m.quantity}</TableCell>
                          <TableCell>{m.personName}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                )}
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
