'use client';

import { PersonsDirectory } from '@/components/persons/persons-directory';

export default function StockistsPage() {
  return (
    <PersonsDirectory
      lockedEntityType="STOCKIST"
      pageTitle="Stockists"
      description="Stockist partners and inventory nodes"
      exportFilenamePrefix="stockists"
      addLabel="Add stockist"
    />
  );
}
