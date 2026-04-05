import { NextRequest } from 'next/server';
import { jsonError, jsonSuccess } from '@/lib/api/response';
import { getSessionUser } from '@/lib/api/session';
import { parsePagination, parseSort } from '@/lib/api/query';
import { createDispatch, listDispatches } from '@/lib/services/dispatch.service';
import { CreateDispatchSchema } from '@/lib/validations/dispatch';

export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return jsonError('Unauthorized', 401);

  const sp = req.nextUrl.searchParams;
  const { page, pageSize } = parsePagination(sp);
  const { sortBy, sortOrder } = parseSort(sp);

  try {
    const { items, total } = await listDispatches(session, {
      page,
      pageSize,
      search: sp.get('search') ?? undefined,
      dateFrom: sp.get('dateFrom') ?? undefined,
      dateTo: sp.get('dateTo') ?? undefined,
      productId: sp.get('productId') ?? undefined,
      personId: sp.get('personId') ?? undefined,
      dispatchType: sp.get('dispatchType') ?? undefined,
      status: sp.get('status') ?? undefined,
      userId: sp.get('userId') ?? undefined,
      sortBy,
      sortOrder,
    });
    return jsonSuccess(items, { total, page, pageSize });
  } catch (e) {
    console.error(e);
    return jsonError('Failed to list dispatches', 500);
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return jsonError('Unauthorized', 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const parsed = CreateDispatchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('Validation failed', 422, parsed.error.flatten());
  }

  try {
    const created = await createDispatch(session, parsed.data);
    return jsonSuccess(created, undefined, { status: 201 });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : 'Failed to create dispatch';
    return jsonError(msg, 400);
  }
}
