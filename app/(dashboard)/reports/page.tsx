'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { ExportButton } from '@/components/reports/export-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const range = { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Download Excel extracts (optionally scoped by date)"
      />

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Date range</CardTitle>
          <CardDescription>Applied to visits and dispatches exports below.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>From</Label>
            <Input type="date" className="mt-1" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <Label>To</Label>
            <Input type="date" className="mt-1" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">HCPs</CardTitle>
            <CardDescription>Full directory export with current filters.</CardDescription>
          </CardHeader>
          <CardContent>
            <ExportButton path="/api/exports/persons" filenamePrefix="persons" query={{}} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Products</CardTitle>
            <CardDescription>Catalog and stock positions.</CardDescription>
          </CardHeader>
          <CardContent>
            <ExportButton path="/api/exports/products" filenamePrefix="products" query={{}} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visits</CardTitle>
            <CardDescription>Includes date range when set.</CardDescription>
          </CardHeader>
          <CardContent>
            <ExportButton path="/api/exports/visits" filenamePrefix="visits" query={range} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dispatches</CardTitle>
            <CardDescription>Includes date range when set.</CardDescription>
          </CardHeader>
          <CardContent>
            <ExportButton path="/api/exports/dispatches" filenamePrefix="dispatches" query={range} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
