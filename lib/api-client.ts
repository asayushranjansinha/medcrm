import type { ApiResponse } from '@/types';

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<{ data: T; meta?: import('@/types').ApiMeta }> {
  const r = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  const j = (await r.json()) as ApiResponse<T>;
  if (!r.ok || !j.success) {
    throw new Error('error' in j ? j.error : 'Request failed');
  }
  return { data: j.data, meta: 'meta' in j ? j.meta : undefined };
}
