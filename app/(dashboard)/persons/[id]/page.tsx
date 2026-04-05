'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { PersonForm } from '@/components/persons/person-form';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
import { usePerson, useUpdatePerson } from '@/hooks/use-persons';
import { useVisits } from '@/hooks/use-visits';
import { useDispatches } from '@/hooks/use-dispatches';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Pencil } from 'lucide-react';
import type { UpdatePersonInput } from '@/lib/validations/person';

export default function PersonDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [editing, setEditing] = useState(false);
  const { data: person, isLoading } = usePerson(id);
  const update = useUpdatePerson(id);
  const { data: visitsData } = useVisits({ personId: id, pageSize: '100' });
  const { data: dispatchesData } = useDispatches({ personId: id, pageSize: '100' });

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

  if (isLoading || !person) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title={person.name} description={`${person.designation} · ${person.hospitalName}`}>
        <Link
          href="/persons"
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
              <CardContent className="text-2xl font-semibold">{person.visitCount ?? person.totalVisits}</CardContent>
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

          <Tabs defaultValue="visits">
            <TabsList>
              <TabsTrigger value="visits">Visit history</TabsTrigger>
              <TabsTrigger value="dispatches">Dispatch history</TabsTrigger>
              <TabsTrigger value="timeline">Activity</TabsTrigger>
            </TabsList>
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
                  <TableBody>
                    {(visitsData?.items ?? []).map((v) => (
                      <TableRow key={v.id}>
                        <TableCell>{formatDate(v.visitDate)}</TableCell>
                        <TableCell>{v.purpose}</TableCell>
                        <TableCell>{v.mrName}</TableCell>
                        <TableCell>{v.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
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
                  <TableBody>
                    {(dispatchesData?.items ?? []).map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>{d.productName}</TableCell>
                        <TableCell>{d.quantity}</TableCell>
                        <TableCell>{formatDate(d.dispatchDate)}</TableCell>
                        <TableCell>{d.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
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
          </Tabs>
        </>
      )}
    </div>
  );
}
