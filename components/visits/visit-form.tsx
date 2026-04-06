'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useFieldArray, useForm, type Resolver } from 'react-hook-form';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectOptionItems,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreateVisitSchema, type CreateVisitInput } from '@/lib/validations/visit';
import { VISIT_PURPOSES, VISIT_STATUSES } from '@/lib/constants';
import { usePersons } from '@/hooks/use-persons';
import { useProducts } from '@/hooks/use-products';

export function VisitForm() {
  const router = useRouter();
  const { data: personsData } = usePersons({ page: '1', pageSize: '200', sortBy: 'name', sortOrder: 'asc' });
  const { data: productsData } = useProducts({ page: '1', pageSize: '200', sortBy: 'name', sortOrder: 'asc' });

  const hcpSelectItems = useMemo(
    () =>
      (personsData?.items ?? []).map((p) => ({
        value: p.id,
        label: `${p.name} — ${p.city}`,
      })),
    [personsData?.items]
  );

  const productSelectItems = useMemo(
    () =>
      (productsData?.items ?? []).map((p) => ({
        value: p.id,
        label: p.name,
      })),
    [productsData?.items]
  );

  const visitPurposeItems = useMemo(
    () => VISIT_PURPOSES.map((p) => ({ value: p.value, label: p.label })),
    []
  );

  const visitStatusItems = useMemo(
    () => VISIT_STATUSES.map((s) => ({ value: s.value, label: s.label })),
    []
  );

  const form = useForm<CreateVisitInput>({
    resolver: zodResolver(CreateVisitSchema) as Resolver<CreateVisitInput>,
    defaultValues: {
      personId: '',
      visitDate: new Date(),
      purpose: 'DETAILING',
      productsDiscussed: [],
      samplesGiven: [],
      feedback: '',
      orderTaken: false,
      orderValue: null,
      nextVisitDate: undefined,
      status: 'PLANNED',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'samplesGiven',
  });

  const orderTaken = form.watch('orderTaken');
  const discussed = form.watch('productsDiscussed') ?? [];

  function toggleProduct(id: string) {
    const set = new Set(discussed);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    form.setValue('productsDiscussed', [...set]);
  }

  async function onSubmit(values: CreateVisitInput) {
    const samplesGiven = (values.samplesGiven ?? []).filter((s) => s.productId && s.qty > 0);
    const payload = { ...values, samplesGiven };
    try {
      const r = await fetch('/api/visits', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j.error ?? 'Failed');
      toast.success('Visit logged');
      router.push('/visits');
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="space-y-2 lg:col-span-2">
          <Label>HCP *</Label>
          <Select
            value={form.watch('personId') || null}
            onValueChange={(v) => form.setValue('personId', v ?? '')}
            items={hcpSelectItems}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select HCP" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {(personsData?.items ?? []).map((p) => (
                <SelectItem key={p.id} value={p.id} label={`${p.name} — ${p.city}`}>
                  {p.name} — {p.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Visit date *</Label>
          <Input
            type="datetime-local"
            value={toLocal(form.watch('visitDate'))}
            onChange={(e) => form.setValue('visitDate', new Date(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Purpose *</Label>
          <Select
            value={form.watch('purpose')}
            onValueChange={(v) => {
              if (v != null) form.setValue('purpose', v as CreateVisitInput['purpose']);
            }}
            items={visitPurposeItems}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectOptionItems options={VISIT_PURPOSES} />
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 lg:col-span-2">
          <Label>Products discussed</Label>
          <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-3">
            {(productsData?.items ?? []).map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm">
                <Checkbox checked={discussed.includes(p.id)} onCheckedChange={() => toggleProduct(p.id)} />
                {p.name}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2 lg:col-span-2">
          <div className="flex items-center justify-between">
            <Label>Samples given</Label>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: '', qty: 1 })}>
              Add row
            </Button>
          </div>
          <div className="space-y-2">
            {fields.map((f, i) => (
              <div key={f.id} className="flex flex-wrap items-end gap-2">
                <div className="min-w-[200px] flex-1">
                  <Select
                    value={form.watch(`samplesGiven.${i}.productId`) || null}
                    onValueChange={(v) =>
                      form.setValue(`samplesGiven.${i}.productId`, v ?? '')
                    }
                    items={productSelectItems}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Product" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {(productsData?.items ?? []).map((p) => (
                        <SelectItem key={p.id} value={p.id} label={p.name}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  type="number"
                  min={1}
                  className="w-24"
                  {...form.register(`samplesGiven.${i}.qty`, { valueAsNumber: true })}
                />
                <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 lg:col-span-2">
          <Label>Feedback</Label>
          <Textarea {...form.register('feedback')} rows={3} />
        </div>

        <div className="flex items-center gap-2 lg:col-span-2">
          <Checkbox
            checked={orderTaken}
            onCheckedChange={(c) => form.setValue('orderTaken', !!c)}
          />
          <Label>Order taken</Label>
        </div>
        {orderTaken ? (
          <div className="space-y-2 lg:col-span-2">
            <Label>Order value</Label>
            <Input type="number" step="0.01" {...form.register('orderValue')} />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label>Next visit</Label>
          <Input
            type="date"
            onChange={(e) =>
              form.setValue('nextVisitDate', e.target.value ? new Date(e.target.value) : undefined)
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Status *</Label>
          <Select
            value={form.watch('status')}
            onValueChange={(v) => {
              if (v != null) form.setValue('status', v as CreateVisitInput['status']);
            }}
            items={visitStatusItems}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectOptionItems options={VISIT_STATUSES} />
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit">Save visit</Button>
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
