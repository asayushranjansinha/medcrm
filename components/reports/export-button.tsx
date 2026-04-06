'use client';

import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { DownloadIcon } from '@/components/ui/download';

export function ExportButton({
  path,
  filenamePrefix,
  query,
  label = 'Export to Excel',
}: {
  path: string;
  filenamePrefix: string;
  query?: Record<string, string | undefined>;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (query) {
        Object.entries(query).forEach(([k, v]) => {
          if (v !== undefined && v !== '') qs.set(k, v);
        });
      }
      const url = qs.toString() ? `${path}?${qs}` : path;
      const r = await fetch(url, { credentials: 'include' });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? 'Export failed');
      }
      const blob = await r.blob();
      const cd = r.headers.get('Content-Disposition');
      const match = cd?.match(/filename="?([^";]+)"?/);
      const name = match?.[1] ?? `${filenamePrefix}.xlsx`;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success('Export complete');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={loading} onClick={onClick}>
      {loading ? (
        <Loader2 className="size-4 shrink-0 animate-spin" />
      ) : (
        <DownloadIcon size={16} className="shrink-0 text-muted-foreground" />
      )}
      <span className="ml-2">{label}</span>
    </Button>
  );
}
