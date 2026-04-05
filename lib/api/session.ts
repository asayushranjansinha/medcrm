import { auth } from '@/lib/auth';
import { sessionFromUser } from '@/lib/rbac';
import type { SessionUser } from '@/types';

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  const u = session?.user;
  if (!u?.id || !u.email || !u.role) return null;
  return sessionFromUser({
    id: u.id,
    name: u.name ?? null,
    email: u.email,
    role: u.role,
    territory: u.territory ?? null,
  });
}
