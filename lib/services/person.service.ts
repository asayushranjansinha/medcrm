import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  max,
  or,
  sql,
  SQL,
} from 'drizzle-orm';
import { db } from '@/lib/db';
import { persons, users, visits } from '@/lib/db/schema';
import { canAccessPerson, personsVisibilityCondition } from '@/lib/rbac';
import type { CreatePersonInput, UpdatePersonInput } from '@/lib/validations/person';
import type { SessionUser } from '@/types';

const SORTABLE = {
  name: persons.name,
  city: persons.city,
  designation: persons.designation,
  hospitalName: persons.hospitalName,
  category: persons.category,
  lastVisitDate: persons.lastVisitDate,
  totalVisits: persons.totalVisits,
  createdAt: persons.createdAt,
} as const;

function escapeIlike(s: string) {
  return s.replace(/[%_\\]/g, '\\$&');
}

export type PersonListQuery = {
  page: number;
  pageSize: number;
  search?: string;
  city?: string;
  state?: string;
  designation?: string;
  hospitalType?: string;
  category?: string;
  assignedToUserId?: string;
  isActive?: string;
  entityType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export async function listPersons(session: SessionUser, q: PersonListQuery) {
  const vis = personsVisibilityCondition(session);
  const conditions: SQL[] = [];
  if (vis) conditions.push(vis);

  if (q.search) {
    const t = `%${escapeIlike(q.search)}%`;
    const searchCond = or(
      ilike(persons.name, t),
      ilike(persons.hospitalName, t),
      ilike(persons.city, t)
    );
    if (searchCond) conditions.push(searchCond);
  }
  if (q.city) conditions.push(eq(persons.city, q.city));
  if (q.state) conditions.push(eq(persons.state, q.state));
  if (q.designation)
    conditions.push(
      eq(persons.designation, q.designation as (typeof persons.$inferSelect)['designation'])
    );
  if (q.hospitalType)
    conditions.push(
      eq(persons.hospitalType, q.hospitalType as (typeof persons.$inferSelect)['hospitalType'])
    );
  if (q.category)
    conditions.push(eq(persons.category, q.category as (typeof persons.$inferSelect)['category']));
  if (q.assignedToUserId) conditions.push(eq(persons.assignedToUserId, q.assignedToUserId));
  if (q.isActive === 'true') conditions.push(eq(persons.isActive, true));
  if (q.isActive === 'false') conditions.push(eq(persons.isActive, false));
  if (q.entityType)
    conditions.push(
      eq(persons.entityType, q.entityType as (typeof persons.$inferSelect)['entityType'])
    );

  const whereClause = and(...conditions.filter(Boolean));

  const [totalRow] = await db.select({ c: count() }).from(persons).where(whereClause);
  const total = Number(totalRow?.c ?? 0);

  const sortCol =
    SORTABLE[(q.sortBy as keyof typeof SORTABLE) ?? 'name'] ?? persons.name;
  const orderFn = q.sortOrder === 'desc' ? desc : asc;

  const offset = (q.page - 1) * q.pageSize;
  const rows = await db
    .select({
      person: persons,
      assignedName: users.name,
    })
    .from(persons)
    .leftJoin(users, eq(persons.assignedToUserId, users.id))
    .where(whereClause)
    .orderBy(orderFn(sortCol))
    .limit(q.pageSize)
    .offset(offset);

  return {
    items: rows.map((r) => ({
      ...r.person,
      assignedMrName: r.assignedName,
    })),
    total,
  };
}

export async function getPersonById(session: SessionUser, id: string) {
  const [row] = await db
    .select({ person: persons, assignedName: users.name })
    .from(persons)
    .leftJoin(users, eq(persons.assignedToUserId, users.id))
    .where(eq(persons.id, id));

  if (!row) return null;
  if (!canAccessPerson(session, row.person.territory, row.person.assignedToUserId)) {
    return null;
  }

  const [orderAgg] = await db
    .select({
      totalOrderValue: sql<string>`coalesce(sum(${visits.orderValue}::numeric), 0)::text`,
    })
    .from(visits)
    .where(and(eq(visits.personId, id), eq(visits.status, 'COMPLETED'), eq(visits.orderTaken, true)));

  return {
    ...row.person,
    assignedMrName: row.assignedName,
    visitCount: row.person.totalVisits,
    lastVisitDate: row.person.lastVisitDate,
    totalOrderValue: orderAgg?.totalOrderValue ?? '0',
  };
}

export async function createPerson(session: SessionUser, input: CreatePersonInput) {
  if (input.assignedToUserId && session.role !== 'ADMIN') {
    const assignee = await db.query.users.findFirst({
      where: eq(users.id, input.assignedToUserId),
    });
    if (!assignee) throw new Error('Assigned user not found');
  }

  const [created] = await db
    .insert(persons)
    .values({
      entityType: input.entityType ?? 'DOCTOR',
      salesRole: input.salesRole ?? null,
      reportingToId: input.reportingToId ?? null,
      zone: input.zone || null,
      region: input.region || null,
      stockistCode: input.stockistCode || null,
      gstin: input.gstin || null,
      creditLimit:
        input.creditLimit !== undefined && input.creditLimit !== null && input.creditLimit !== ''
          ? String(input.creditLimit)
          : null,
      outstandingAmount:
        input.outstandingAmount !== undefined &&
        input.outstandingAmount !== null &&
        input.outstandingAmount !== ''
          ? String(input.outstandingAmount)
          : null,
      entityHospitalType: input.entityHospitalType ?? null,
      bedCount: input.bedCount ?? null,
      name: input.name,
      designation: input.designation,
      specialty: input.specialty || null,
      qualification: input.qualification || null,
      hospitalName: input.hospitalName,
      hospitalType: input.hospitalType,
      address: input.address || null,
      city: input.city,
      state: input.state,
      pincode: input.pincode && input.pincode !== '' ? input.pincode : null,
      phone: input.phone,
      email: input.email && input.email !== '' ? input.email : null,
      category: input.category,
      territory: input.territory || null,
      assignedToUserId: input.assignedToUserId ?? null,
      notes: input.notes || null,
    })
    .returning();

  return created;
}

export async function updatePerson(session: SessionUser, id: string, input: UpdatePersonInput) {
  const existing = await db.query.persons.findFirst({ where: eq(persons.id, id) });
  if (!existing) return null;
  if (!canAccessPerson(session, existing.territory, existing.assignedToUserId)) return null;

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.entityType !== undefined) patch.entityType = input.entityType;
  if (input.salesRole !== undefined) patch.salesRole = input.salesRole;
  if (input.reportingToId !== undefined) patch.reportingToId = input.reportingToId ?? null;
  if (input.zone !== undefined) patch.zone = input.zone || null;
  if (input.region !== undefined) patch.region = input.region || null;
  if (input.stockistCode !== undefined) patch.stockistCode = input.stockistCode || null;
  if (input.gstin !== undefined) patch.gstin = input.gstin || null;
  if (input.creditLimit !== undefined)
    patch.creditLimit =
      input.creditLimit !== null && input.creditLimit !== ''
        ? String(input.creditLimit)
        : null;
  if (input.outstandingAmount !== undefined)
    patch.outstandingAmount =
      input.outstandingAmount !== null && input.outstandingAmount !== ''
        ? String(input.outstandingAmount)
        : null;
  if (input.entityHospitalType !== undefined) patch.entityHospitalType = input.entityHospitalType;
  if (input.bedCount !== undefined) patch.bedCount = input.bedCount;
  if (input.name !== undefined) patch.name = input.name;
  if (input.designation !== undefined) patch.designation = input.designation;
  if (input.specialty !== undefined) patch.specialty = input.specialty || null;
  if (input.qualification !== undefined) patch.qualification = input.qualification || null;
  if (input.hospitalName !== undefined) patch.hospitalName = input.hospitalName;
  if (input.hospitalType !== undefined) patch.hospitalType = input.hospitalType;
  if (input.address !== undefined) patch.address = input.address || null;
  if (input.city !== undefined) patch.city = input.city;
  if (input.state !== undefined) patch.state = input.state;
  if (input.pincode !== undefined)
    patch.pincode = input.pincode && input.pincode !== '' ? input.pincode : null;
  if (input.phone !== undefined) patch.phone = input.phone;
  if (input.email !== undefined)
    patch.email = input.email && input.email !== '' ? input.email : null;
  if (input.category !== undefined) patch.category = input.category;
  if (input.territory !== undefined) patch.territory = input.territory || null;
  if (input.assignedToUserId !== undefined) patch.assignedToUserId = input.assignedToUserId ?? null;
  if (input.notes !== undefined) patch.notes = input.notes || null;

  const [updated] = await db
    .update(persons)
    .set(patch as typeof persons.$inferInsert)
    .where(eq(persons.id, id))
    .returning();

  return updated ?? null;
}

export async function softDeletePerson(session: SessionUser, id: string) {
  const existing = await db.query.persons.findFirst({ where: eq(persons.id, id) });
  if (!existing) return null;
  if (!canAccessPerson(session, existing.territory, existing.assignedToUserId)) return null;

  const [updated] = await db
    .update(persons)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(persons.id, id))
    .returning();

  return updated ?? null;
}

export async function bulkMarkPersonsInactive(session: SessionUser, ids: string[]) {
  if (ids.length === 0) return 0;
  const vis = personsVisibilityCondition(session);
  const accessible = await db
    .select({ id: persons.id })
    .from(persons)
    .where(vis ? and(vis, inArray(persons.id, ids)) : inArray(persons.id, ids));

  const allowed = new Set(accessible.map((a) => a.id));
  const toUpdate = ids.filter((id) => allowed.has(id));
  if (toUpdate.length === 0) return 0;

  await db
    .update(persons)
    .set({ isActive: false, updatedAt: new Date() })
    .where(inArray(persons.id, toUpdate));

  return toUpdate.length;
}

export async function refreshPersonVisitAggregates(personId: string) {
  const [row] = await db
    .select({
      total: count(visits.id),
      last: max(visits.visitDate),
    })
    .from(visits)
    .where(and(eq(visits.personId, personId), eq(visits.status, 'COMPLETED')));

  await db
    .update(persons)
    .set({
      totalVisits: Number(row?.total ?? 0),
      lastVisitDate: row?.last ?? null,
      updatedAt: new Date(),
    })
    .where(eq(persons.id, personId));
}
