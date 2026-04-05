'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { Person } from '@/lib/db/schema';

export type PersonRow = Person & { assignedMrName?: string | null };

export function usePersons(params: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, v);
  });
  return useQuery({
    queryKey: ['persons', qs.toString()],
    queryFn: async () => {
      const { data, meta } = await apiFetch<PersonRow[]>(`/api/persons?${qs}`);
      return { items: data, meta };
    },
    staleTime: 30_000,
  });
}

export function usePerson(id: string | undefined) {
  return useQuery({
    queryKey: ['person', id],
    queryFn: async () => {
      const { data } = await apiFetch<PersonRow & { totalOrderValue?: string }>(`/api/persons/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 0,
  });
}

export function useCreatePerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) =>
      apiFetch<Person>('/api/persons', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['persons'] }),
  });
}

export function useUpdatePerson(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) =>
      apiFetch<Person>(`/api/persons/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['persons'] });
      qc.invalidateQueries({ queryKey: ['person', id] });
    },
  });
}

export function useDeletePerson(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<Person>(`/api/persons/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['persons'] });
      qc.invalidateQueries({ queryKey: ['person', id] });
    },
  });
}

export function useBulkDeactivatePersons() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      apiFetch<{ updated: number }>('/api/persons/bulk', {
        method: 'POST',
        body: JSON.stringify({ ids, action: 'deactivate' }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['persons'] }),
  });
}
