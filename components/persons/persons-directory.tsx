'use client';

import type { ColumnDef, RowSelectionState } from '@tanstack/react-table';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { DataTable } from '@/components/shared/data-table';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ExportButton } from '@/components/reports/export-button';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectOptionItems,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBulkDeactivatePersons, usePersons, type PersonRow } from '@/hooks/use-persons';
import { useUsers } from '@/hooks/use-users';
import { formatDate } from '@/lib/utils';
import {
  DESIGNATIONS,
  ENTITY_TYPES,
  HOSPITAL_TYPES,
  PERSON_CATEGORIES,
  CITIES,
} from '@/lib/constants';
import { EyeIcon } from '@/components/ui/eye';
import { Filter } from 'lucide-react';

export type PersonsDirectoryProps = {
  lockedEntityType?: 'EMPLOYEE' | 'STOCKIST' | 'HOSPITAL' | 'DOCTOR';
  pageTitle?: string;
  description?: string;
  exportFilenamePrefix?: string;
  addLabel?: string;
};

function selectFilterValue(v: string | null | undefined) {
  if (!v || v === '__all__') return '';
  return v;
}

export function PersonsDirectory({
  lockedEntityType,
  pageTitle = 'Directory',
  description = 'People and organizations',
  exportFilenamePrefix = 'persons',
  addLabel = 'Add person',
}: PersonsDirectoryProps) {
  const searchParams = useSearchParams();
  const urlEntity = searchParams.get('entityType') as PersonsDirectoryProps['lockedEntityType'] | null;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [filters, setFilters] = useState({
    city: '',
    state: '',
    designation: '',
    hospitalType: '',
    category: '',
    assignedToUserId: '',
    isActive: '',
    entityType: '' as string,
  });

  useEffect(() => {
    if (!lockedEntityType && urlEntity && ['EMPLOYEE', 'STOCKIST', 'HOSPITAL', 'DOCTOR'].includes(urlEntity)) {
      setFilters((f) => ({ ...f, entityType: urlEntity }));
    }
  }, [urlEntity, lockedEntityType]);

  const entityTypeParam = lockedEntityType ?? (filters.entityType || undefined);

  const { data, isLoading } = usePersons({
    page: String(page),
    pageSize: '25',
    search: search || undefined,
    sortBy: 'name',
    sortOrder: 'asc',
    city: filters.city || undefined,
    state: filters.state || undefined,
    designation: filters.designation || undefined,
    hospitalType: filters.hospitalType || undefined,
    category: filters.category || undefined,
    assignedToUserId: filters.assignedToUserId || undefined,
    isActive: filters.isActive || undefined,
    entityType: entityTypeParam,
  });

  const bulk = useBulkDeactivatePersons();
  const { data: users } = useUsers();

  const columns = useMemo<ColumnDef<PersonRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <Link className="text-primary font-medium hover:underline" href={`/persons/${row.original.id}`}>
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: 'entityType',
        header: 'Entity',
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.entityType ?? 'DOCTOR'}</Badge>
        ),
      },
      { accessorKey: 'salesRole', header: 'Role', cell: ({ row }) => row.original.salesRole ?? '—' },
      { accessorKey: 'designation', header: 'Designation' },
      { accessorKey: 'specialty', header: 'Specialty' },
      { accessorKey: 'hospitalName', header: 'Hospital / Org' },
      { accessorKey: 'city', header: 'City' },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => <Badge variant="outline">{row.original.category}</Badge>,
      },
      {
        accessorKey: 'lastVisitDate',
        header: 'Last visit',
        cell: ({ row }) => formatDate(row.original.lastVisitDate),
      },
      { accessorKey: 'totalVisits', header: 'Visits' },
      {
        accessorKey: 'assignedMrName',
        header: 'Assigned MR',
        cell: ({ row }) => row.original.assignedMrName ?? '—',
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Link
            href={`/persons/${row.original.id}`}
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

  const exportQuery = {
    search: search || undefined,
    city: filters.city || undefined,
    state: filters.state || undefined,
    designation: filters.designation || undefined,
    hospitalType: filters.hospitalType || undefined,
    category: filters.category || undefined,
    assignedToUserId: filters.assignedToUserId || undefined,
    isActive: filters.isActive || undefined,
    entityType: entityTypeParam,
    sortBy: 'name',
    sortOrder: 'asc',
  };

  async function runBulkDeactivate() {
    const ids = Object.keys(rowSelection).filter((k) => rowSelection[k]);
    if (ids.length === 0) return;
    try {
      await bulk.mutateAsync(ids);
      toast.success(`Marked ${ids.length} record(s) inactive`);
      setRowSelection({});
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Bulk update failed');
    } finally {
      setConfirmBulk(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={pageTitle} description={description}>
        <ExportButton
          path="/api/exports/persons"
          filenamePrefix={exportFilenamePrefix}
          query={exportQuery}
        />
        <Link href="/persons/new" className={cn(buttonVariants({ variant: 'secondary' }))}>
          {addLabel}
        </Link>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
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
              {!lockedEntityType ? (
                <div>
                  <Label>Entity type</Label>
                  <Select
                    value={filters.entityType || '__all__'}
                    onValueChange={(v) =>
                      setFilters((f) => ({
                        ...f,
                        entityType: selectFilterValue(v),
                      }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__" label="Any">
                        Any
                      </SelectItem>
                      <SelectOptionItems options={ENTITY_TYPES} />
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div>
                <Label>City</Label>
                <Select
                  value={filters.city || '__all__'}
                  onValueChange={(v) => setFilters((f) => ({ ...f, city: selectFilterValue(v) }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__" label="Any">
                      Any
                    </SelectItem>
                    {CITIES.map((c) => (
                      <SelectItem key={c} value={c} label={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Designation</Label>
                <Select
                  value={filters.designation || '__all__'}
                  onValueChange={(v) =>
                    setFilters((f) => ({ ...f, designation: selectFilterValue(v) }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__" label="Any">
                      Any
                    </SelectItem>
                    <SelectOptionItems options={DESIGNATIONS} />
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hospital type</Label>
                <Select
                  value={filters.hospitalType || '__all__'}
                  onValueChange={(v) =>
                    setFilters((f) => ({ ...f, hospitalType: selectFilterValue(v) }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__" label="Any">
                      Any
                    </SelectItem>
                    <SelectOptionItems options={HOSPITAL_TYPES} />
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={filters.category || '__all__'}
                  onValueChange={(v) =>
                    setFilters((f) => ({ ...f, category: selectFilterValue(v) }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__" label="Any">
                      Any
                    </SelectItem>
                    <SelectOptionItems options={PERSON_CATEGORIES} />
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assigned MR</Label>
                <Select
                  value={filters.assignedToUserId || '__all__'}
                  onValueChange={(v) =>
                    setFilters((f) => ({ ...f, assignedToUserId: selectFilterValue(v) }))
                  }
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
              <div>
                <Label>Active</Label>
                <Select
                  value={filters.isActive || '__all__'}
                  onValueChange={(v) =>
                    setFilters((f) => ({ ...f, isActive: selectFilterValue(v) }))
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
        <Button
          variant="outline"
          size="sm"
          disabled={Object.keys(rowSelection).filter((k) => rowSelection[k]).length === 0}
          onClick={() => setConfirmBulk(true)}
        >
          Mark inactive
        </Button>
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
        searchPlaceholder="Search name, hospital, city…"
        enableRowSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        getRowId={(row) => row.id}
      />

      <ConfirmDialog
        open={confirmBulk}
        onOpenChange={setConfirmBulk}
        title="Mark inactive?"
        description="Selected records will be marked inactive (soft delete)."
        confirmLabel="Deactivate"
        destructive
        onConfirm={runBulkDeactivate}
      />
    </div>
  );
}
