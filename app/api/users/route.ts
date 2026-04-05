import { eq } from 'drizzle-orm';
import { jsonError, jsonSuccess } from '@/lib/api/response';
import { getSessionUser } from '@/lib/api/session';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

export async function GET() {
  const session = await getSessionUser();
  if (!session) return jsonError('Unauthorized', 401);

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      territory: users.territory,
    })
    .from(users)
    .where(eq(users.isActive, true));

  return jsonSuccess(rows);
}
