'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { Visit } from '@/lib/db/schema';

export type VisitRow = Visit & {
  personName: string;
  personCity: string;
  personCategory: string;
  mrName?: string | null;
};

export function useVisits(params: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, v);
  });
  return useQuery({
    queryKey: ['visits', qs.toString()],
    queryFn: async () => {
      const { data, meta } = await apiFetch<VisitRow[]>(`/api/visits?${qs}`);
      return { items: data, meta };
    },
    staleTime: 30_000,
  });
}

export function useVisit(id: string | undefined) {
  return useQuery({
    queryKey: ['visit', id],
    queryFn: async () => {
      const { data } = await apiFetch<VisitRow>(`/api/visits/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 0,
  });
}

export function useCreateVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) =>
      apiFetch<Visit>('/api/visits', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visits'] });
      qc.invalidateQueries({ queryKey: ['persons'] });
    },
  });
}

export function useUpdateVisit(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) =>
      apiFetch<Visit>(`/api/visits/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visits'] });
      qc.invalidateQueries({ queryKey: ['visit', id] });
    },
  });
}

export function useDeleteVisit(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ ok: boolean }>(`/api/visits/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visits'] });
      qc.invalidateQueries({ queryKey: ['persons'] });
    },
  });
}
