'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { PerformanceRow } from '@/lib/services/performance.service';

export function useFieldPerformance() {
  return useQuery({
    queryKey: ['field-performance'],
    queryFn: async () => {
      const { data } = await apiFetch<PerformanceRow[]>('/api/performance');
      return data;
    },
    staleTime: 30_000,
  });
}
