'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectOptionItems,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CreateProductSchema,
  type CreateProductInput,
  UpdateProductSchema,
  type UpdateProductInput,
} from '@/lib/validations/product';
import { PRODUCT_CATEGORIES } from '@/lib/constants';
import type { Product } from '@/lib/db/schema';
import { format } from 'date-fns';

export function ProductForm({
  defaultValues,
  onSubmit,
  submitLabel = 'Save',
  redirectAfter = '/products',
}: {
  defaultValues?: Partial<Product>;
  onSubmit: (data: CreateProductInput | UpdateProductInput) => Promise<void>;
  submitLabel?: string;
  redirectAfter?: string | false;
}) {
  const router = useRouter();
  const isEdit = !!defaultValues?.id;
  const form = useForm<CreateProductInput>({
    resolver: zodResolver(isEdit ? UpdateProductSchema : CreateProductSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      genericName: defaultValues?.genericName ?? '',
      category: defaultValues?.category ?? 'TABLET',
      description: defaultValues?.description ?? '',
      mrp: defaultValues?.mrp != null ? String(defaultValues.mrp) : '',
      ptr: defaultValues?.ptr != null ? String(defaultValues.ptr) : '',
      pts: defaultValues?.pts != null ? String(defaultValues.pts) : '',
      manufacturer: defaultValues?.manufacturer ?? '',
      batchNumber: defaultValues?.batchNumber ?? '',
      expiryDate: defaultValues?.expiryDate
        ? new Date(defaultValues.expiryDate)
        : new Date(Date.now() + 86400000 * 365),
      stockQty: defaultValues?.stockQty ?? 0,
      isActive: defaultValues?.isActive ?? true,
    },
  });

  async function handleSubmit(values: CreateProductInput) {
    try {
      await onSubmit(values);
      toast.success(isEdit ? 'Product updated' : 'Product created');
      if (redirectAfter === false) {
        router.refresh();
        return;
      }
      router.push(redirectAfter);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="w-full space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="space-y-2 lg:col-span-2">
          <Label>Name *</Label>
          <Input {...form.register('name')} />
        </div>
        <div className="space-y-2 lg:col-span-2">
          <Label>Generic name *</Label>
          <Input {...form.register('genericName')} />
        </div>
        <div className="space-y-2">
          <Label>Category *</Label>
          <Select
            value={form.watch('category')}
            onValueChange={(v) => form.setValue('category', v as CreateProductInput['category'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectOptionItems options={PRODUCT_CATEGORIES} />
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 lg:col-span-2">
          <Label>Description</Label>
          <Textarea {...form.register('description')} rows={2} />
        </div>
        <div className="space-y-2">
          <Label>MRP *</Label>
          <Input type="number" step="0.01" {...form.register('mrp')} />
        </div>
        <div className="space-y-2">
          <Label>PTR *</Label>
          <Input type="number" step="0.01" {...form.register('ptr')} />
        </div>
        <div className="space-y-2">
          <Label>PTS</Label>
          <Input type="number" step="0.01" {...form.register('pts')} />
        </div>
        <div className="space-y-2 lg:col-span-2">
          <Label>Manufacturer *</Label>
          <Input {...form.register('manufacturer')} />
        </div>
        <div className="space-y-2">
          <Label>Batch number</Label>
          <Input {...form.register('batchNumber')} />
        </div>
        <div className="space-y-2">
          <Label>Expiry *</Label>
          <Input
            type="date"
            value={format(form.watch('expiryDate'), 'yyyy-MM-dd')}
            onChange={(e) => form.setValue('expiryDate', new Date(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label>Initial stock *</Label>
          <Input type="number" {...form.register('stockQty', { valueAsNumber: true })} />
        </div>
        <div className="flex items-center gap-2 pt-2 lg:col-span-2">
          <Checkbox
            checked={form.watch('isActive')}
            onCheckedChange={(c) => form.setValue('isActive', !!c)}
          />
          <Label>Active</Label>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit">{submitLabel}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
