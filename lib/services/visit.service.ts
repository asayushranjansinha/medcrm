import { and, desc, eq, gte, ilike, lte, SQL } from 'drizzle-orm';
import { db } from '@/lib/db';
import { persons, users, visits } from '@/lib/db/schema';
import { refreshPersonVisitAggregates } from '@/lib/services/person.service';
import { canAccessPerson, visitAccessible } from '@/lib/rbac';
import type { CreateVisitInput, UpdateVisitInput } from '@/lib/validations/visit';
import type { SessionUser } from '@/types';

function escapeIlike(s: string) {
  return s.replace(/[%_\\]/g, '\\$&');
}

export type VisitListQuery = {
  page: number;
  pageSize: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  personId?: string;
  userId?: string;
  purpose?: string;
  status?: string;
  city?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export async function listVisits(session: SessionUser, q: VisitListQuery) {
  const conditions: SQL[] = [];

  if (q.dateFrom) conditions.push(gte(visits.visitDate, new Date(q.dateFrom)));
  if (q.dateTo) conditions.push(lte(visits.visitDate, new Date(q.dateTo)));
  if (q.personId) conditions.push(eq(visits.personId, q.personId));
  if (q.userId) conditions.push(eq(visits.userId, q.userId));
  if (q.purpose)
    conditions.push(eq(visits.purpose, q.purpose as (typeof visits.$inferSelect)['purpose']));
  if (q.status)
    conditions.push(eq(visits.status, q.status as (typeof visits.$inferSelect)['status']));
  if (q.city) conditions.push(ilike(persons.city, `%${escapeIlike(q.city)}%`));

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const base = db
    .select({
      visit: visits,
      personName: persons.name,
      personCity: persons.city,
      personCategory: persons.category,
      personTerritory: persons.territory,
      assignedToUserId: persons.assignedToUserId,
      mrName: users.name,
    })
    .from(visits)
    .innerJoin(persons, eq(visits.personId, persons.id))
    .innerJoin(users, eq(visits.userId, users.id))
    .$dynamic();

  const rowsAll = await base.where(whereClause).orderBy(desc(visits.visitDate));

  const filtered = rowsAll.filter((r) =>
    visitAccessible(session, r.personTerritory, r.assignedToUserId, r.visit.userId)
  );

  if (q.search) {
    const t = q.search.toLowerCase();
    const f = filtered.filter(
      (r) =>
        r.personName.toLowerCase().includes(t) ||
        r.personCity.toLowerCase().includes(t) ||
        (r.mrName?.toLowerCase().includes(t) ?? false)
    );
    return paginateSlice(f, q);
  }

  return paginateSlice(filtered, q);
}

function paginateSlice<
  T extends {
    visit: (typeof visits.$inferSelect);
    personName: string;
    personCity: string;
    personCategory: (typeof persons.$inferSelect)['category'];
    personTerritory: string | null;
    assignedToUserId: string | null;
    mrName: string | null;
  },
>(filtered: T[], q: VisitListQuery) {
  const total = filtered.length;
  const sortCol = q.sortBy ?? 'visitDate';
  const mult = q.sortOrder === 'asc' ? 1 : -1;
  const sorted = [...filtered].sort((a, b) => {
    if (sortCol === 'visitDate') {
      return (a.visit.visitDate.getTime() - b.visit.visitDate.getTime()) * mult;
    }
    if (sortCol === 'status') return String(a.visit.status).localeCompare(String(b.visit.status)) * mult;
    if (sortCol === 'purpose')
      return String(a.visit.purpose).localeCompare(String(b.visit.purpose)) * mult;
    return (a.visit.visitDate.getTime() - b.visit.visitDate.getTime()) * mult;
  });
  const offset = (q.page - 1) * q.pageSize;
  const slice = sorted.slice(offset, offset + q.pageSize);
  return {
    items: slice.map((r) => ({
      ...r.visit,
      personName: r.personName,
      personCity: r.personCity,
      personCategory: r.personCategory,
      mrName: r.mrName,
    })),
    total,
  };
}

export async function getVisitById(session: SessionUser, id: string) {
  const [row] = await db
    .select({
      visit: visits,
      personTerritory: persons.territory,
      assignedToUserId: persons.assignedToUserId,
      personName: persons.name,
      mrName: users.name,
    })
    .from(visits)
    .innerJoin(persons, eq(visits.personId, persons.id))
    .innerJoin(users, eq(visits.userId, users.id))
    .where(eq(visits.id, id));

  if (!row) return null;
  if (!visitAccessible(session, row.personTerritory, row.assignedToUserId, row.visit.userId)) {
    return null;
  }

  return {
    ...row.visit,
    personName: row.personName,
    mrName: row.mrName,
  };
}

export async function createVisit(session: SessionUser, input: CreateVisitInput) {
  const person = await db.query.persons.findFirst({ where: eq(persons.id, input.personId) });
  if (!person) throw new Error('HCP not found');
  if (!canAccessPerson(session, person.territory, person.assignedToUserId)) {
    throw new Error('Forbidden');
  }

  const userId =
    session.role === 'ADMIN' && input.userId ? input.userId : session.id;

  const [created] = await db
    .insert(visits)
    .values({
      personId: input.personId,
      userId,
      visitDate: input.visitDate,
      purpose: input.purpose,
      productsDiscussed: input.productsDiscussed?.length ? input.productsDiscussed : null,
      samplesGiven: input.samplesGiven?.length ? input.samplesGiven : null,
      feedback: input.feedback || null,
      orderTaken: input.orderTaken ?? false,
      orderValue: input.orderValue && input.orderTaken ? String(input.orderValue) : null,
      nextVisitDate: input.nextVisitDate ?? null,
      status: input.status,
    })
    .returning();

  await refreshPersonVisitAggregates(input.personId);
  return created;
}

export async function updateVisit(session: SessionUser, id: string, input: UpdateVisitInput) {
  const existing = await db.query.visits.findFirst({ where: eq(visits.id, id) });
  if (!existing) return null;

  const person = await db.query.persons.findFirst({ where: eq(persons.id, existing.personId) });
  if (!person) return null;
  if (!visitAccessible(session, person.territory, person.assignedToUserId, existing.userId)) {
    return null;
  }

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.personId !== undefined) patch.personId = input.personId;
  if (input.visitDate !== undefined) patch.visitDate = input.visitDate;
  if (input.purpose !== undefined) patch.purpose = input.purpose;
  if (input.productsDiscussed !== undefined)
    patch.productsDiscussed = input.productsDiscussed?.length ? input.productsDiscussed : null;
  if (input.samplesGiven !== undefined)
    patch.samplesGiven = input.samplesGiven?.length ? input.samplesGiven : null;
  if (input.feedback !== undefined) patch.feedback = input.feedback || null;
  if (input.orderTaken !== undefined) patch.orderTaken = input.orderTaken;
  if (input.orderValue !== undefined)
    patch.orderValue =
      input.orderValue && (input.orderTaken ?? existing.orderTaken)
        ? String(input.orderValue)
        : null;
  if (input.nextVisitDate !== undefined) patch.nextVisitDate = input.nextVisitDate;
  if (input.status !== undefined) patch.status = input.status;
  if (session.role === 'ADMIN' && input.userId) patch.userId = input.userId;

  const [updated] = await db
    .update(visits)
    .set(patch as typeof visits.$inferInsert)
    .where(eq(visits.id, id))
    .returning();
  const pid = (updated?.personId ?? existing.personId) as string;
  await refreshPersonVisitAggregates(pid);
  if (input.personId && input.personId !== existing.personId) {
    await refreshPersonVisitAggregates(existing.personId);
  }
  return updated ?? null;
}

export async function deleteVisit(session: SessionUser, id: string) {
  const existing = await db.query.visits.findFirst({ where: eq(visits.id, id) });
  if (!existing) return false;

  const person = await db.query.persons.findFirst({ where: eq(persons.id, existing.personId) });
  if (!person) return false;
  if (!visitAccessible(session, person.territory, person.assignedToUserId, existing.userId)) {
    return false;
  }

  await db.delete(visits).where(eq(visits.id, id));
  await refreshPersonVisitAggregates(existing.personId);
  return true;
}

export async function listVisitsForPerson(personId: string) {
  return db
    .select({
      visit: visits,
      mrName: users.name,
    })
    .from(visits)
    .innerJoin(users, eq(visits.userId, users.id))
    .where(eq(visits.personId, personId))
    .orderBy(desc(visits.visitDate));
}
