'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from '@/components/ui/sonner';
import { z } from 'zod';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/api-client';

const Schema = z.object({
  name: z.string().min(2).max(200),
  phone: z
    .union([
      z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
      z.literal(''),
    ])
    .optional(),
});

type FormValues = z.infer<typeof Schema>;

export default function SettingsPage() {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { name: '', phone: '' },
  });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiFetch<{ name: string; phone: string | null }>('/api/users/me');
        form.reset({ name: data.name, phone: data.phone ?? '' });
      } catch {
        toast.error('Could not load profile');
      }
    })();
  }, [form]);

  async function onSubmit(values: FormValues) {
    try {
      await apiFetch('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify(values),
      });
      router.refresh();
      toast.success('Profile updated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Your profile" />
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...form.register('name')} />
              {form.formState.errors.name ? (
                <p className="text-destructive text-sm">{form.formState.errors.name.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input {...form.register('phone')} />
              {form.formState.errors.phone ? (
                <p className="text-destructive text-sm">{form.formState.errors.phone.message}</p>
              ) : null}
            </div>
            <Button type="submit">Save</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
