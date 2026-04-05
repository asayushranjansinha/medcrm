'use client';

import { PageHeader } from '@/components/shared/page-header';
import { VisitForm } from '@/components/visits/visit-form';

export default function NewVisitPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Log visit" description="Record a call with an HCP" />
      <VisitForm />
    </div>
  );
}
