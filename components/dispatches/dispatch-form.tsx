'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { toast } from '@/components/ui/sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectOptionItems,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { CreateDispatchSchema, type CreateDispatchInput } from '@/lib/validations/dispatch';
import { DISPATCH_STATUSES, DISPATCH_TYPES, MOVEMENT_TYPES } from '@/lib/constants';
import { usePersons, type PersonRow } from '@/hooks/use-persons';
import { useProducts } from '@/hooks/use-products';
import { useQueryClient } from '@tanstack/react-query';

function PersonCombo({
  label,
  value,
  onChange,
  entityType,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  entityType?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { data } = usePersons({
    page: '1',
    pageSize: '200',
    sortBy: 'name',
    sortOrder: 'asc',
    entityType: entityType || undefined,
  });
  const items = data?.items ?? [];
  const selected = items.find((p) => p.id === value);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          type="button"
          disabled={disabled}
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'w-full justify-between font-normal'
          )}
        >
          {selected ? `${selected.name} — ${selected.city}` : 'Search by name…'}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search…" />
            <CommandList>
              <CommandEmpty>No person found.</CommandEmpty>
              <CommandGroup>
                {items.map((p: PersonRow) => (
                  <CommandItem
                    key={p.id}
                    value={`${p.name} ${p.city}`}
                    onSelect={() => {
                      onChange(p.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn('mr-2 size-4', value === p.id ? 'opacity-100' : 'opacity-0')}
                    />
                    {p.name} — {p.city}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function DispatchForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: productsData } = useProducts({ page: '1', pageSize: '200', sortBy: 'name', sortOrder: 'asc' });

  const form = useForm<CreateDispatchInput>({
    resolver: zodResolver(CreateDispatchSchema) as Resolver<CreateDispatchInput>,
    defaultValues: {
      movementType: 'COMPANY_TO_STOCKIST',
      fromEntityId: undefined,
      toEntityId: undefined,
      fromEntityType: undefined,
      toEntityType: undefined,
      toRetailerName: undefined,
      productId: '',
      personId: undefined,
      dispatchType: 'SALE',
      quantity: 1,
      batchNumber: '',
      dispatchDate: new Date(),
      expectedDeliveryDate: undefined,
      status: 'PENDING',
      invoiceNumber: '',
      totalValue: null,
      address: '',
      remarks: '',
    },
  });

  const movementType = form.watch('movementType');
  const fromEntityId = form.watch('fromEntityId');
  const toEntityId = form.watch('toEntityId');
  const productId = form.watch('productId');

  const stock = useMemo(() => {
    const p = productsData?.items.find((x) => x.id === productId);
    return p?.stockQty ?? null;
  }, [productsData, productId]);

  const anchorPersonId = form.watch('personId');
  const partyForAddress = useMemo(() => {
    if (movementType === 'COMPANY_TO_STOCKIST' || movementType === 'COMPANY_TO_HOSPITAL')
      return toEntityId;
    if (movementType === 'SAMPLE_TO_DOCTOR') return toEntityId;
    if (movementType === 'STOCKIST_TO_HOSPITAL') return toEntityId;
    return anchorPersonId ?? toEntityId ?? fromEntityId;
  }, [movementType, toEntityId, fromEntityId, anchorPersonId]);

  const { data: addressPersons } = usePersons({
    page: '1',
    pageSize: '200',
    sortBy: 'name',
    sortOrder: 'asc',
  });

  useEffect(() => {
    if (!partyForAddress) return;
    const p = addressPersons?.items.find((x) => x.id === partyForAddress);
    if (p?.address) {
      const line = [p.address, p.city, p.state, p.pincode].filter(Boolean).join(', ');
      form.setValue('address', line);
    }
  }, [partyForAddress, addressPersons, form]);

  async function onSubmit(values: CreateDispatchInput) {
    try {
      const r = await fetch('/api/dispatches', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j.error ?? 'Failed');
      toast.success('Stock movement recorded');
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      qc.invalidateQueries({ queryKey: ['person-extensions'] });
      router.push('/dispatches');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  }

  const showFromStockist =
    movementType === 'STOCKIST_TO_HOSPITAL' ||
    movementType === 'STOCKIST_TO_RETAILER' ||
    movementType === 'RETURN_FROM_STOCKIST';
  const showToStockist = movementType === 'RETURN_FROM_HOSPITAL';
  const showFromHospital = movementType === 'RETURN_FROM_HOSPITAL';
  const showToHospital = movementType === 'STOCKIST_TO_HOSPITAL' || movementType === 'COMPANY_TO_HOSPITAL';
  const showToStockistRecipient = movementType === 'COMPANY_TO_STOCKIST';
  const showToDoctor = movementType === 'SAMPLE_TO_DOCTOR';
  const showRetailerName = movementType === 'STOCKIST_TO_RETAILER';
  const showAdjustmentAnchor = movementType === 'ADJUSTMENT';

  const companyOutbound =
    movementType === 'COMPANY_TO_STOCKIST' ||
    movementType === 'COMPANY_TO_HOSPITAL' ||
    movementType === 'SAMPLE_TO_DOCTOR';

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="space-y-2">
          <Label>Movement type *</Label>
          <Select
            value={movementType}
            onValueChange={(v) => {
              form.setValue('movementType', v as CreateDispatchInput['movementType']);
              form.setValue('fromEntityId', undefined);
              form.setValue('toEntityId', undefined);
              form.setValue('personId', undefined);
              form.setValue('toRetailerName', undefined);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectOptionItems options={MOVEMENT_TYPES} />
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 lg:col-span-2 rounded-md border p-3 text-sm">
          <p className="text-muted-foreground font-medium">Parties</p>
          {(movementType === 'COMPANY_TO_STOCKIST' ||
            movementType === 'COMPANY_TO_HOSPITAL' ||
            movementType === 'RETURN_FROM_STOCKIST') && (
            <p className="text-muted-foreground">
              <span className="text-foreground font-medium">From:</span>{' '}
              {movementType === 'RETURN_FROM_STOCKIST' ? 'Stockist' : 'Company (warehouse)'}
            </p>
          )}
          {(movementType === 'RETURN_FROM_HOSPITAL' || movementType === 'STOCKIST_TO_RETAILER') && (
            <p className="text-muted-foreground">
              <span className="text-foreground font-medium">To:</span>{' '}
              {movementType === 'STOCKIST_TO_RETAILER' ? 'Retailer (external)' : 'Stockist'}
            </p>
          )}
          {movementType === 'SAMPLE_TO_DOCTOR' && (
            <p className="text-muted-foreground">
              <span className="text-foreground font-medium">From:</span> MR (your linked employee profile)
            </p>
          )}
          {movementType === 'ADJUSTMENT' && (
            <p className="text-muted-foreground">
              Select an anchor record for this adjustment (inventory rules may not apply).
            </p>
          )}
        </div>

        {showFromStockist ? (
          <PersonCombo
            label="From (stockist) *"
            value={fromEntityId ?? ''}
            onChange={(v) => form.setValue('fromEntityId', v || undefined)}
            entityType="STOCKIST"
          />
        ) : null}

        {showFromHospital ? (
          <PersonCombo
            label="From (hospital) *"
            value={fromEntityId ?? ''}
            onChange={(v) => form.setValue('fromEntityId', v || undefined)}
            entityType="HOSPITAL"
          />
        ) : null}

        {showToStockistRecipient ? (
          <PersonCombo
            label="To (stockist) *"
            value={toEntityId ?? ''}
            onChange={(v) => form.setValue('toEntityId', v || undefined)}
            entityType="STOCKIST"
          />
        ) : null}

        {showToStockist ? (
          <PersonCombo
            label="To (stockist) *"
            value={toEntityId ?? ''}
            onChange={(v) => form.setValue('toEntityId', v || undefined)}
            entityType="STOCKIST"
          />
        ) : null}

        {showToHospital ? (
          <PersonCombo
            label="To (hospital) *"
            value={toEntityId ?? ''}
            onChange={(v) => form.setValue('toEntityId', v || undefined)}
            entityType="HOSPITAL"
          />
        ) : null}

        {showToDoctor ? (
          <PersonCombo
            label="To (doctor) *"
            value={toEntityId ?? ''}
            onChange={(v) => form.setValue('toEntityId', v || undefined)}
            entityType="DOCTOR"
          />
        ) : null}

        {showRetailerName ? (
          <div className="space-y-2 lg:col-span-2">
            <Label>Retailer name *</Label>
            <Input
              placeholder="Retailer / chemist name"
              {...form.register('toRetailerName')}
            />
          </div>
        ) : null}

        {showAdjustmentAnchor ? (
          <div className="lg:col-span-2">
            <PersonCombo
              label="Anchor person *"
              value={anchorPersonId ?? ''}
              onChange={(v) => form.setValue('personId', v || undefined)}
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label>Product *</Label>
          <Select
            value={productId || ''}
            onValueChange={(v) => {
              if (v) form.setValue('productId', v);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select product" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {(productsData?.items ?? []).map((p) => (
                <SelectItem
                  key={p.id}
                  value={p.id}
                  label={`${p.name} (stock: ${p.stockQty})`}
                >
                  {p.name} (stock: {p.stockQty})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {stock != null && companyOutbound ? (
            <p className="text-muted-foreground text-xs">Company warehouse: {stock} units</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label>Dispatch category *</Label>
          <Select
            value={form.watch('dispatchType')}
            onValueChange={(v) => form.setValue('dispatchType', v as CreateDispatchInput['dispatchType'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectOptionItems options={DISPATCH_TYPES} />
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Quantity *</Label>
          <Input
            type="number"
            min={1}
            max={companyOutbound && stock != null ? stock : undefined}
            {...form.register('quantity', { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label>Batch</Label>
          <Input {...form.register('batchNumber')} />
        </div>
        <div className="space-y-2">
          <Label>Dispatch date *</Label>
          <Input
            type="datetime-local"
            value={toLocal(form.watch('dispatchDate'))}
            onChange={(e) => form.setValue('dispatchDate', new Date(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Expected delivery</Label>
          <Input
            type="date"
            onChange={(e) =>
              form.setValue(
                'expectedDeliveryDate',
                e.target.value ? new Date(e.target.value) : undefined
              )
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Status *</Label>
          <Select
            value={form.watch('status')}
            onValueChange={(v) => form.setValue('status', v as CreateDispatchInput['status'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectOptionItems options={DISPATCH_STATUSES} />
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Invoice #</Label>
          <Input {...form.register('invoiceNumber')} />
        </div>
        <div className="space-y-2">
          <Label>Total value</Label>
          <Input
            type="number"
            step="0.01"
            {...form.register('totalValue', {
              setValueAs: (v) => (v === '' || v == null ? null : v),
            })}
          />
        </div>

        <div className="space-y-2 lg:col-span-2">
          <Label>Delivery address</Label>
          <Textarea {...form.register('address')} rows={2} />
        </div>
        <div className="space-y-2 lg:col-span-2">
          <Label>Remarks</Label>
          <Textarea {...form.register('remarks')} rows={2} />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit">Save movement</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function toLocal(d: Date) {
  const x = new Date(d);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
}
