'use client';

import { PageHeader } from '@/components/shared/page-header';
import { DispatchForm } from '@/components/dispatches/dispatch-form';

export default function NewDispatchPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New stock movement" description="Record transfers and dispatches" />
      <DispatchForm />
    </div>
  );
}
