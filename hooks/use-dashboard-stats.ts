'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await apiFetch<Record<string, unknown>>('/api/dashboard/stats');
      return data;
    },
    staleTime: 30_000,
  });
}
