'use client';

import { PageHeader } from '@/components/shared/page-header';
import { PersonForm } from '@/components/persons/person-form';
import { useCreatePerson } from '@/hooks/use-persons';
import type { CreatePersonInput } from '@/lib/validations/person';

export default function NewPersonPage() {
  const create = useCreatePerson();

  return (
    <div className="space-y-6">
      <PageHeader title="Add HCP" description="Create a healthcare professional record" />
      <PersonForm
        submitLabel="Create HCP"
        onSubmit={async (data) => {
          await create.mutateAsync(data as CreatePersonInput);
        }}
      />
    </div>
  );
}
