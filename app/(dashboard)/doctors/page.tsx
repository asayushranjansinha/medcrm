'use client';

import { PersonsDirectory } from '@/components/persons/persons-directory';

export default function DoctorsPage() {
  return (
    <PersonsDirectory
      lockedEntityType="DOCTOR"
      pageTitle="Doctors"
      description="Healthcare professionals (HCPs)"
      exportFilenamePrefix="doctors"
      addLabel="Add doctor"
    />
  );
}
