'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreateDispatchSchema, type CreateDispatchInput } from '@/lib/validations/dispatch';
import { DISPATCH_TYPES, DISPATCH_STATUSES } from '@/lib/constants';
import { usePersons } from '@/hooks/use-persons';
import { useProducts } from '@/hooks/use-products';

export function DispatchForm() {
  const router = useRouter();
  const { data: personsData } = usePersons({ page: '1', pageSize: '200', sortBy: 'name', sortOrder: 'asc' });
  const { data: productsData } = useProducts({ page: '1', pageSize: '200', sortBy: 'name', sortOrder: 'asc' });

  const form = useForm<CreateDispatchInput>({
    resolver: zodResolver(CreateDispatchSchema),
    defaultValues: {
      productId: '',
      personId: '',
      dispatchType: 'SAMPLE',
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

  const productId = form.watch('productId');
  const personId = form.watch('personId');
  const stock = useMemo(() => {
    const p = productsData?.items.find((x) => x.id === productId);
    return p?.stockQty ?? null;
  }, [productsData, productId]);

  useEffect(() => {
    const p = personsData?.items.find((x) => x.id === personId);
    if (p?.address) {
      const line = [p.address, p.city, p.state, p.pincode].filter(Boolean).join(', ');
      form.setValue('address', line);
    }
  }, [personId, personsData, form]);

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
      toast.success('Dispatch recorded');
      router.push('/dispatches');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="space-y-2">
          <Label>Product *</Label>
          <Select value={productId} onValueChange={(v) => form.setValue('productId', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select product" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {(productsData?.items ?? []).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} (stock: {p.stockQty})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {stock != null ? (
            <p className="text-muted-foreground text-xs">Available: {stock} units</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label>Recipient HCP *</Label>
          <Select value={personId} onValueChange={(v) => form.setValue('personId', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select HCP" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {(personsData?.items ?? []).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} — {p.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Type *</Label>
          <Select
            value={form.watch('dispatchType')}
            onValueChange={(v) => form.setValue('dispatchType', v as CreateDispatchInput['dispatchType'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DISPATCH_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Quantity *</Label>
          <Input
            type="number"
            min={1}
            max={stock ?? undefined}
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
              {DISPATCH_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Invoice #</Label>
          <Input {...form.register('invoiceNumber')} />
        </div>
        <div className="space-y-2">
          <Label>Total value</Label>
          <Input type="number" step="0.01" {...form.register('totalValue')} />
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
        <Button type="submit">Save dispatch</Button>
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
