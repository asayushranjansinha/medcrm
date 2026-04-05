'use client';

import { PageHeader } from '@/components/shared/page-header';
import { DispatchForm } from '@/components/dispatches/dispatch-form';

export default function NewDispatchPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New dispatch" description="Record outbound inventory to an HCP" />
      <DispatchForm />
    </div>
  );
}
