'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { Dispatch } from '@/lib/db/schema';

export type DispatchRow = Dispatch & {
  productName: string;
  genericName: string;
  productCategory: string;
  personName: string;
  personCity: string;
  dispatchedByName?: string | null;
};

export function useDispatches(params: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, v);
  });
  return useQuery({
    queryKey: ['dispatches', qs.toString()],
    queryFn: async () => {
      const { data, meta } = await apiFetch<DispatchRow[]>(`/api/dispatches?${qs}`);
      return { items: data, meta };
    },
    staleTime: 30_000,
  });
}

export function useDispatch(id: string | undefined) {
  return useQuery({
    queryKey: ['dispatch', id],
    queryFn: async () => {
      const { data } = await apiFetch<DispatchRow>(`/api/dispatches/${id}`);
      return data;
    },
    enabled: !!id,
    staleTime: 0,
  });
}

export function useCreateDispatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) =>
      apiFetch<Dispatch>('/api/dispatches', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dispatches'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateDispatch(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) =>
      apiFetch<Dispatch>(`/api/dispatches/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dispatches'] });
      qc.invalidateQueries({ queryKey: ['dispatch', id] });
    },
  });
}
