'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
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
import {
  CreatePersonSchema,
  type CreatePersonInput,
  UpdatePersonSchema,
  type UpdatePersonInput,
} from '@/lib/validations/person';
import {
  DESIGNATIONS,
  HOSPITAL_TYPES,
  PERSON_CATEGORIES,
} from '@/lib/constants';
import { useUsers } from '@/hooks/use-users';
import type { Person } from '@/lib/db/schema';

export function PersonForm({
  defaultValues,
  onSubmit,
  submitLabel = 'Save',
  redirectAfter = '/persons',
}: {
  defaultValues?: Partial<Person>;
  onSubmit: (data: CreatePersonInput | UpdatePersonInput) => Promise<void>;
  submitLabel?: string;
  /** Set `false` to stay on page (e.g. inline edit on detail). */
  redirectAfter?: string | false;
}) {
  const router = useRouter();
  const { data: users } = useUsers();
  const isEdit = !!defaultValues?.id;
  const form = useForm<CreatePersonInput>({
    resolver: zodResolver(isEdit ? UpdatePersonSchema : CreatePersonSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      designation: defaultValues?.designation ?? 'DOCTOR',
      specialty: defaultValues?.specialty ?? '',
      qualification: defaultValues?.qualification ?? '',
      hospitalName: defaultValues?.hospitalName ?? '',
      hospitalType: defaultValues?.hospitalType ?? 'PRIVATE',
      address: defaultValues?.address ?? '',
      city: defaultValues?.city ?? '',
      state: defaultValues?.state ?? '',
      pincode: defaultValues?.pincode ?? '',
      phone: defaultValues?.phone ?? '',
      email: defaultValues?.email ?? '',
      category: defaultValues?.category ?? 'B',
      territory: defaultValues?.territory ?? '',
      assignedToUserId: defaultValues?.assignedToUserId ?? undefined,
      notes: defaultValues?.notes ?? '',
    },
  });

  async function handleSubmit(values: CreatePersonInput) {
    try {
      await onSubmit(values);
      toast.success(isEdit ? 'HCP updated' : 'HCP created');
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
          {form.formState.errors.name ? (
            <p className="text-destructive text-sm">{form.formState.errors.name.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label>Designation *</Label>
          <Select
            value={form.watch('designation')}
            onValueChange={(v) => form.setValue('designation', v as CreatePersonInput['designation'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DESIGNATIONS.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Category *</Label>
          <Select
            value={form.watch('category')}
            onValueChange={(v) => form.setValue('category', v as CreatePersonInput['category'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERSON_CATEGORIES.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Specialty</Label>
          <Input {...form.register('specialty')} />
        </div>
        <div className="space-y-2">
          <Label>Qualification</Label>
          <Input {...form.register('qualification')} />
        </div>
        <div className="space-y-2 lg:col-span-2">
          <Label>Hospital name *</Label>
          <Input {...form.register('hospitalName')} />
        </div>
        <div className="space-y-2">
          <Label>Hospital type *</Label>
          <Select
            value={form.watch('hospitalType')}
            onValueChange={(v) => form.setValue('hospitalType', v as CreatePersonInput['hospitalType'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOSPITAL_TYPES.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 lg:col-span-2">
          <Label>Address</Label>
          <Input {...form.register('address')} />
        </div>
        <div className="space-y-2">
          <Label>City *</Label>
          <Input {...form.register('city')} />
        </div>
        <div className="space-y-2">
          <Label>State *</Label>
          <Input {...form.register('state')} />
        </div>
        <div className="space-y-2">
          <Label>Pincode</Label>
          <Input {...form.register('pincode')} />
        </div>
        <div className="space-y-2">
          <Label>Phone *</Label>
          <Input {...form.register('phone')} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input {...form.register('email')} />
        </div>
        <div className="space-y-2">
          <Label>Territory</Label>
          <Input {...form.register('territory')} />
        </div>
        <div className="space-y-2">
          <Label>Assigned MR</Label>
          <Select
            value={form.watch('assignedToUserId') ?? '__none__'}
            onValueChange={(v) =>
              form.setValue('assignedToUserId', v === '__none__' ? undefined : v)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Unassigned</SelectItem>
              {(users ?? []).map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 lg:col-span-2">
          <Label>Notes</Label>
          <Textarea {...form.register('notes')} rows={3} />
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
