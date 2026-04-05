import { NextRequest } from 'next/server';
import { jsonError, jsonSuccess } from '@/lib/api/response';
import { getSessionUser } from '@/lib/api/session';
import { parsePagination, parseSort } from '@/lib/api/query';
import { listPersons, createPerson } from '@/lib/services/person.service';
import { CreatePersonSchema } from '@/lib/validations/person';

export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return jsonError('Unauthorized', 401);

  const sp = req.nextUrl.searchParams;
  const { page, pageSize } = parsePagination(sp);
  const { sortBy, sortOrder } = parseSort(sp);

  try {
    const { items, total } = await listPersons(session, {
      page,
      pageSize,
      search: sp.get('search') ?? undefined,
      city: sp.get('city') ?? undefined,
      state: sp.get('state') ?? undefined,
      designation: sp.get('designation') ?? undefined,
      hospitalType: sp.get('hospitalType') ?? undefined,
      category: sp.get('category') ?? undefined,
      assignedToUserId: sp.get('assignedToUserId') ?? undefined,
      isActive: sp.get('isActive') ?? undefined,
      sortBy,
      sortOrder,
    });
    return jsonSuccess(items, { total, page, pageSize });
  } catch (e) {
    console.error(e);
    return jsonError('Failed to list persons', 500);
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

  const parsed = CreatePersonSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('Validation failed', 422, parsed.error.flatten());
  }

  try {
    const created = await createPerson(session, parsed.data);
    return jsonSuccess(created, undefined, { status: 201 });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : 'Failed to create person';
    return jsonError(msg, 400);
  }
}
