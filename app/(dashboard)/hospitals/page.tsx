'use client';

import { PersonsDirectory } from '@/components/persons/persons-directory';

export default function HospitalsPage() {
  return (
    <PersonsDirectory
      lockedEntityType="HOSPITAL"
      pageTitle="Hospitals"
      description="Hospital and institutional customers"
      exportFilenamePrefix="hospitals"
      addLabel="Add hospital"
    />
  );
}
