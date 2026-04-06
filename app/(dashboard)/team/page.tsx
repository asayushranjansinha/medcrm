'use client';

import { PersonsDirectory } from '@/components/persons/persons-directory';

export default function TeamPage() {
  return (
    <PersonsDirectory
      lockedEntityType="EMPLOYEE"
      pageTitle="Team"
      description="Sales and field employees"
      exportFilenamePrefix="team"
      addLabel="Add employee"
    />
  );
}
