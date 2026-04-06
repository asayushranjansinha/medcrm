'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { PageHeader } from '@/components/shared/page-header';
import { PageLoader } from '@/components/shared/page-loader';
import { TableBodySkeleton } from '@/components/shared/table-body-skeleton';
import { PersonForm } from '@/components/persons/person-form';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { usePerson, useUpdatePerson } from '@/hooks/use-persons';
import { usePersonExtensions } from '@/hooks/use-person-extensions';
import { useVisits } from '@/hooks/use-visits';
import { useDispatches } from '@/hooks/use-dispatches';
import { Badge } from '@/components/ui/badge';
import { Pencil } from 'lucide-react';
import type { UpdatePersonInput } from '@/lib/validations/person';

const perfChartConfig = {
  target: { label: 'Target', color: 'var(--chart-1)' },
  achieved: { label: 'Achieved', color: 'var(--chart-2)' },
} satisfies ChartConfig;

function StockStatusBadge({ status }: { status: string }) {
  const variant =
    status === 'OUT OF STOCK'
      ? 'destructive'
      : status === 'LOW'
        ? 'secondary'
        : status === 'OVERSTOCKED'
          ? 'outline'
          : 'default';
  return <Badge variant={variant}>{status}</Badge>;
}

export default function PersonDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [editing, setEditing] = useState(false);
  const { data: person, isLoading } = usePerson(id);
  const update = useUpdatePerson(id);
  const { data: visitsData, isPending: visitsPending } = useVisits({ personId: id, pageSize: '100' });
  const { data: dispatchesData, isPending: dispatchesPending } = useDispatches({
    personId: id,
    pageSize: '100',
  });
  const { data: ext, isPending: extPending } = usePersonExtensions(id);

  const entityType = person?.entityType ?? 'DOCTOR';
  const isDoctor = entityType === 'DOCTOR';
  const isHospital = entityType === 'HOSPITAL';
  const isStockist = entityType === 'STOCKIST';
  const isEmployee = entityType === 'EMPLOYEE';

  const defaultTab = isStockist
    ? 'inventory'
    : isHospital
      ? 'stock'
      : isEmployee
        ? 'performance'
        : 'visits';

  const timeline = useMemo(() => {
    const v =
      visitsData?.items.map((x) => ({
        at: x.visitDate,
        label: 'Visit',
        sub: `${x.purpose} — ${x.status}`,
      })) ?? [];
    const d =
      dispatchesData?.items.map((x) => ({
        at: x.dispatchDate,
        label: 'Dispatch',
        sub: `${x.productName} × ${x.quantity}`,
      })) ?? [];
    return [...v, ...d].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [visitsData, dispatchesData]);

  if (isLoading) {
    return <PageLoader />;
  }
  if (!person) {
    return <p className="text-muted-foreground">Person not found.</p>;
  }

  const perfChartData =
    ext && ext.entityType === 'EMPLOYEE'
      ? ext.performance.last6Months.map((m) => ({
          label: `${m.month}/${String(m.year).slice(-2)}`,
          target: m.target,
          achieved: m.achieved,
        }))
      : [];

  return (
    <div className="space-y-6">
      <PageHeader title={person.name} description={`${person.designation} · ${person.hospitalName}`}>
        <Link
          href={
            isDoctor
              ? '/doctors'
              : isHospital
                ? '/hospitals'
                : isStockist
                  ? '/stockists'
                  : isEmployee
                    ? '/team'
                    : '/persons'
          }
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
        >
          Back
        </Link>
        <Button variant="secondary" size="sm" onClick={() => setEditing((e) => !e)}>
          <Pencil className="size-4" />
          {editing ? 'Cancel edit' : 'Edit'}
        </Button>
      </PageHeader>

      {editing ? (
        <PersonForm
          defaultValues={person}
          submitLabel="Save changes"
          redirectAfter={false}
          onSubmit={async (data) => {
            await update.mutateAsync(data as UpdatePersonInput);
            setEditing(false);
          }}
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-xs font-medium">Total visits</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">{person.totalVisits}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-xs font-medium">Last visit</CardTitle>
              </CardHeader>
              <CardContent className="text-lg font-medium">{formatDate(person.lastVisitDate)}</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-xs font-medium">Order value</CardTitle>
              </CardHeader>
              <CardContent className="text-lg font-medium">
                {formatCurrency(person.totalOrderValue ?? 0)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-muted-foreground text-xs font-medium">Category</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge>{person.category}</Badge>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground grid gap-2 text-sm sm:grid-cols-2">
              <p>
                <span className="text-foreground font-medium">Entity:</span> {person.entityType}
              </p>
              <p>
                <span className="text-foreground font-medium">City:</span> {person.city}, {person.state}
              </p>
              <p>
                <span className="text-foreground font-medium">Phone:</span> {person.phone}
              </p>
              <p>
                <span className="text-foreground font-medium">Email:</span> {person.email ?? '—'}
              </p>
              <p>
                <span className="text-foreground font-medium">Territory:</span> {person.territory ?? '—'}
              </p>
              <p>
                <span className="text-foreground font-medium">Assigned MR:</span>{' '}
                {(person as { assignedMrName?: string }).assignedMrName ?? '—'}
              </p>
              <p className="sm:col-span-2">
                <span className="text-foreground font-medium">Notes:</span> {person.notes ?? '—'}
              </p>
            </CardContent>
          </Card>

          <Tabs defaultValue={defaultTab} key={`${id}-${entityType}`}>
            <TabsList className="flex flex-wrap gap-1">
              {isStockist ? (
                <>
                  <TabsTrigger value="inventory">Inventory</TabsTrigger>
                  <TabsTrigger value="sales">Sales</TabsTrigger>
                </>
              ) : null}
              {isHospital ? <TabsTrigger value="stock">Stock</TabsTrigger> : null}
              {isEmployee ? <TabsTrigger value="performance">Performance</TabsTrigger> : null}
              {isDoctor || isHospital ? <TabsTrigger value="visits">Visit history</TabsTrigger> : null}
              {isDoctor ? (
                <>
                  <TabsTrigger value="dispatches">Dispatch history</TabsTrigger>
                  <TabsTrigger value="timeline">Activity</TabsTrigger>
                </>
              ) : null}
            </TabsList>

            {isStockist ? (
              <>
                <TabsContent value="inventory">
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead>Last movement</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      {extPending ? (
                        <TableBodySkeleton columns={4} rows={6} />
                      ) : ext?.entityType === 'STOCKIST' ? (
                        <TableBody>
                          {(ext.inventory ?? []).length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-muted-foreground">
                                No inventory rows yet.
                              </TableCell>
                            </TableRow>
                          ) : (
                            ext.inventory.map((row) => (
                              <TableRow key={row.productId}>
                                <TableCell>{row.productName}</TableCell>
                                <TableCell className="text-right">{row.currentQty}</TableCell>
                                <TableCell>
                                  {row.lastMovementDate
                                    ? formatDate(new Date(row.lastMovementDate as string))
                                    : '—'}
                                </TableCell>
                                <TableCell>
                                  <StockStatusBadge status={row.stockStatus} />
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      ) : (
                        <TableBody>
                          <TableRow>
                            <TableCell colSpan={4} className="text-muted-foreground">
                              Could not load inventory.
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      )}
                    </Table>
                  </div>
                </TabsContent>
                <TabsContent value="sales">
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead className="text-right">Units</TableHead>
                          <TableHead className="text-right">Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      {extPending ? (
                        <TableBodySkeleton columns={3} rows={6} />
                      ) : ext?.entityType === 'STOCKIST' ? (
                        <TableBody>
                          {(ext.salesByMonth ?? []).length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-muted-foreground">
                                No outbound movements recorded.
                              </TableCell>
                            </TableRow>
                          ) : (
                            ext.salesByMonth.map((row, i) => (
                              <TableRow key={`${row.year}-${row.month}-${i}`}>
                                <TableCell>
                                  {row.month}/{row.year}
                                </TableCell>
                                <TableCell className="text-right">{row.units}</TableCell>
                                <TableCell className="text-right">{formatCurrency(row.value)}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      ) : (
                        <TableBody>
                          <TableRow>
                            <TableCell colSpan={3} className="text-muted-foreground">
                              Could not load sales.
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      )}
                    </Table>
                  </div>
                </TabsContent>
              </>
            ) : null}

            {isHospital ? (
              <TabsContent value="stock">
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead>Last movement</TableHead>
                      </TableRow>
                    </TableHeader>
                    {extPending ? (
                      <TableBodySkeleton columns={3} rows={6} />
                    ) : ext?.entityType === 'HOSPITAL' ? (
                      <TableBody>
                        {(ext.inventory ?? []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-muted-foreground">
                              No stock rows yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          ext.inventory.map((row) => (
                            <TableRow key={row.productId}>
                              <TableCell>{row.productName}</TableCell>
                              <TableCell className="text-right">{row.currentQty}</TableCell>
                              <TableCell>
                                {row.lastMovementDate
                                  ? formatDate(new Date(row.lastMovementDate as string))
                                  : '—'}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    ) : (
                      <TableBody>
                        <TableRow>
                          <TableCell colSpan={3} className="text-muted-foreground">
                            Could not load stock.
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    )}
                  </Table>
                </div>
              </TabsContent>
            ) : null}

            {isEmployee ? (
              <TabsContent value="performance" className="space-y-6">
                {extPending ? (
                  <PageLoader variant="inline" />
                ) : ext?.entityType === 'EMPLOYEE' ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">This month</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Target</span>
                          <span className="font-medium">{formatCurrency(ext.performance.targetInr)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Achieved</span>
                          <span className="font-medium">{formatCurrency(ext.performance.achievedInr)}</span>
                        </div>
                        <div>
                          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                            <span>Achievement</span>
                            <span>{ext.performance.achievementPct}%</span>
                          </div>
                          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                            <div
                              className="bg-primary h-full transition-all"
                              style={{
                                width: `${Math.min(100, ext.performance.achievementPct)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    {perfChartData.length > 0 ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Last 6 months</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ChartContainer
                            config={perfChartConfig}
                            className="h-[240px] min-h-[240px] w-full !aspect-auto"
                          >
                            <BarChart data={perfChartData} margin={{ left: 8, right: 8 }}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Bar dataKey="target" fill="var(--color-target)" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="achieved" fill="var(--color-achieved)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ChartContainer>
                        </CardContent>
                      </Card>
                    ) : null}
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">Could not load performance.</p>
                )}
              </TabsContent>
            ) : null}

            {(isDoctor || isHospital) && (
              <TabsContent value="visits">
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Purpose</TableHead>
                        <TableHead>MR</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    {visitsPending ? (
                      <TableBodySkeleton columns={4} rows={6} />
                    ) : (
                      <TableBody>
                        {(visitsData?.items ?? []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-muted-foreground">
                              No visits recorded.
                            </TableCell>
                          </TableRow>
                        ) : (
                          (visitsData?.items ?? []).map((v) => (
                            <TableRow key={v.id}>
                              <TableCell>{formatDate(v.visitDate)}</TableCell>
                              <TableCell>{v.purpose}</TableCell>
                              <TableCell>{v.mrName}</TableCell>
                              <TableCell>{v.status}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    )}
                  </Table>
                </div>
              </TabsContent>
            )}

            {isDoctor ? (
              <>
                <TabsContent value="dispatches">
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      {dispatchesPending ? (
                        <TableBodySkeleton columns={4} rows={6} />
                      ) : (
                        <TableBody>
                          {(dispatchesData?.items ?? []).length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-muted-foreground">
                                No dispatches recorded.
                              </TableCell>
                            </TableRow>
                          ) : (
                            (dispatchesData?.items ?? []).map((d) => (
                              <TableRow key={d.id}>
                                <TableCell>{d.productName}</TableCell>
                                <TableCell>{d.quantity}</TableCell>
                                <TableCell>{formatDate(d.dispatchDate)}</TableCell>
                                <TableCell>{d.status}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      )}
                    </Table>
                  </div>
                </TabsContent>
                <TabsContent value="timeline">
                  <ul className="space-y-3 text-sm">
                    {timeline.map((t, i) => (
                      <li key={i} className="border-b pb-2">
                        <p className="font-medium">
                          {t.label} · {formatDate(t.at)}
                        </p>
                        <p className="text-muted-foreground">{t.sub}</p>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
              </>
            ) : null}
          </Tabs>
        </>
      )}
    </div>
  );
}
