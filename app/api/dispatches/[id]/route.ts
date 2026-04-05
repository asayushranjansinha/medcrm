import { NextRequest } from 'next/server';
import { jsonError, jsonSuccess } from '@/lib/api/response';
import { getSessionUser } from '@/lib/api/session';
import { getDispatchById, updateDispatch } from '@/lib/services/dispatch.service';
import { UpdateDispatchSchema } from '@/lib/validations/dispatch';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await getSessionUser();
  if (!session) return jsonError('Unauthorized', 401);
  const { id } = await ctx.params;

  const row = await getDispatchById(session, id);
  if (!row) return jsonError('Not found', 404);
  return jsonSuccess(row);
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const session = await getSessionUser();
  if (!session) return jsonError('Unauthorized', 401);
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const parsed = UpdateDispatchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('Validation failed', 422, parsed.error.flatten());
  }

  const updated = await updateDispatch(session, id, parsed.data);
  if (!updated) return jsonError('Not found', 404);
  return jsonSuccess(updated);
}
