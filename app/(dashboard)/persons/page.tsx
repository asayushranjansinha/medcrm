'use client';

import { PersonsDirectory } from '@/components/persons/persons-directory';

export default function PersonsPage() {
  return (
    <PersonsDirectory
      pageTitle="Persons"
      description="All entities — filter by type or use sidebar shortcuts"
      exportFilenamePrefix="persons"
      addLabel="Add person"
    />
  );
}
