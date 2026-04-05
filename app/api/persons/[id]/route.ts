import { NextRequest } from 'next/server';
import { jsonError, jsonSuccess } from '@/lib/api/response';
import { getSessionUser } from '@/lib/api/session';
import {
  getPersonById,
  updatePerson,
  softDeletePerson,
} from '@/lib/services/person.service';
import { UpdatePersonSchema } from '@/lib/validations/person';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await getSessionUser();
  if (!session) return jsonError('Unauthorized', 401);
  const { id } = await ctx.params;

  const person = await getPersonById(session, id);
  if (!person) return jsonError('Not found', 404);
  return jsonSuccess(person);
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

  const parsed = UpdatePersonSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('Validation failed', 422, parsed.error.flatten());
  }

  const updated = await updatePerson(session, id, parsed.data);
  if (!updated) return jsonError('Not found', 404);
  return jsonSuccess(updated);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getSessionUser();
  if (!session) return jsonError('Unauthorized', 401);
  const { id } = await ctx.params;

  const updated = await softDeletePerson(session, id);
  if (!updated) return jsonError('Not found', 404);
  return jsonSuccess(updated);
}
