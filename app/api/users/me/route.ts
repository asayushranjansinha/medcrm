import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { jsonError, jsonSuccess } from '@/lib/api/response';
import { getSessionUser } from '@/lib/api/session';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

const PatchSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  phone: z
    .union([
      z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
      z.literal(''),
    ])
    .optional(),
});

export async function GET() {
  const session = await getSessionUser();
  if (!session) return jsonError('Unauthorized', 401);

  const row = await db.query.users.findFirst({
    where: eq(users.id, session.id),
    columns: { id: true, name: true, email: true, role: true, territory: true, phone: true },
  });
  if (!row) return jsonError('Not found', 404);
  return jsonSuccess(row);
}

export async function PUT(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return jsonError('Unauthorized', 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('Validation failed', 422, parsed.error.flatten());
  }

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.phone !== undefined)
    patch.phone = parsed.data.phone === '' ? null : parsed.data.phone;

  const [updated] = await db
    .update(users)
    .set(patch as typeof users.$inferInsert)
    .where(eq(users.id, session.id))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      territory: users.territory,
      phone: users.phone,
    });

  if (!updated) return jsonError('Not found', 404);
  return jsonSuccess(updated);
}
