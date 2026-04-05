import { NextRequest } from 'next/server';
import { z } from 'zod';
import { jsonError, jsonSuccess } from '@/lib/api/response';
import { getSessionUser } from '@/lib/api/session';
import { bulkMarkPersonsInactive } from '@/lib/services/person.service';

const BodySchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  action: z.literal('deactivate'),
});

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return jsonError('Unauthorized', 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON', 400);
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('Validation failed', 422, parsed.error.flatten());
  }

  const n = await bulkMarkPersonsInactive(session, parsed.data.ids);
  return jsonSuccess({ updated: n });
}
