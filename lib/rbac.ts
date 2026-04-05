import { eq, or, sql, SQL } from 'drizzle-orm';
import { persons } from '@/lib/db/schema';
import type { SessionUser } from '@/types';

/** Row-level filter for persons table based on session. */
export function personsVisibilityCondition(session: SessionUser): SQL | undefined {
  if (session.role === 'ADMIN') return undefined;
  if (session.role === 'MANAGER') {
    if (!session.territory) return sql`false`;
    return eq(persons.territory, session.territory);
  }
  if (!session.territory) {
    return eq(persons.assignedToUserId, session.id);
  }
  return or(
    eq(persons.assignedToUserId, session.id),
    eq(persons.territory, session.territory)
  );
}

export function canAccessPerson(session: SessionUser, personTerritory: string | null, assignedToUserId: string | null): boolean {
  if (session.role === 'ADMIN') return true;
  if (session.role === 'MANAGER') {
    return session.territory != null && personTerritory === session.territory;
  }
  return assignedToUserId === session.id || personTerritory === session.territory;
}

export function visitAccessible(
  session: SessionUser,
  personTerritory: string | null,
  assignedToUserId: string | null,
  visitUserId: string
): boolean {
  if (visitUserId === session.id) return true;
  return canAccessPerson(session, personTerritory, assignedToUserId);
}

export function dispatchAccessible(
  session: SessionUser,
  personTerritory: string | null,
  assignedToUserId: string | null,
  dispatchUserId: string
): boolean {
  if (dispatchUserId === session.id) return true;
  return canAccessPerson(session, personTerritory, assignedToUserId);
}

export function sessionFromUser(user: {
  id: string;
  name: string | null;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'MR';
  territory: string | null;
}): SessionUser {
  return {
    id: user.id,
    name: user.name ?? user.email,
    email: user.email,
    role: user.role,
    territory: user.territory,
  };
}
