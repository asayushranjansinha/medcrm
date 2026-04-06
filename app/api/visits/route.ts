import { NextRequest } from 'next/server';
import { jsonError, jsonSuccess } from '@/lib/api/response';
import { getSessionUser } from '@/lib/api/session';
import { parsePagination, parseSort } from '@/lib/api/query';
import { createVisit, listVisits } from '@/lib/services/visit.service';
import { CreateVisitSchema } from '@/lib/validations/visit';

export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return jsonError('Unauthorized', 401);

  const sp = req.nextUrl.searchParams;
  const { page, pageSize } = parsePagination(sp);
  const { sortBy, sortOrder } = parseSort(sp);

  try {
    const { items, total } = await listVisits(session, {
      page,
      pageSize,
      search: sp.get('search') ?? undefined,
      dateFrom: sp.get('dateFrom') ?? undefined,
      dateTo: sp.get('dateTo') ?? undefined,
      personId: sp.get('personId') ?? undefined,
      userId: sp.get('userId') ?? undefined,
      purpose: sp.get('purpose') ?? undefined,
      status: sp.get('status') ?? undefined,
      city: sp.get('city') ?? undefined,
      sortBy,
      sortOrder,
    });
    return jsonSuccess(items, { total, page, pageSize });
  } catch (e) {
    console.error(e);
    return jsonError('Failed to list visits', 500);
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

  const parsed = CreateVisitSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('Validation failed', 422, parsed.error.flatten());
  }

  try {
    const created = await createVisit(session, parsed.data);
    return jsonSuccess(created, undefined, { status: 201 });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : 'Failed to create visit';
    return jsonError(msg, 400);
  }
}
