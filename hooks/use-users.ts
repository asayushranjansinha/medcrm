'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export type UserOption = {
  id: string;
  name: string;
  email: string;
  role: string;
  territory: string | null;
};

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await apiFetch<UserOption[]>('/api/users');
      return data;
    },
    staleTime: 60_000,
  });
}
