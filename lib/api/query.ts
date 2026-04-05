export function parsePagination(sp: URLSearchParams) {
  const page = Math.max(1, Number.parseInt(sp.get('page') ?? '1', 10) || 1);
  const raw = Number.parseInt(sp.get('pageSize') ?? '25', 10) || 25;
  const pageSize = Math.min(100, Math.max(1, raw));
  return { page, pageSize };
}

export function parseSort(sp: URLSearchParams) {
  const sortBy = sp.get('sortBy') ?? undefined;
  const order = sp.get('sortOrder') === 'desc' ? 'desc' : 'asc';
  return { sortBy, sortOrder: order as 'asc' | 'desc' };
}
