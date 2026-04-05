import { and, desc, eq, gte, lte, sql, SQL } from 'drizzle-orm';
import { db } from '@/lib/db';
import { dispatches, persons, products, users } from '@/lib/db/schema';
import { canAccessPerson, dispatchAccessible } from '@/lib/rbac';
import type { CreateDispatchInput, UpdateDispatchInput } from '@/lib/validations/dispatch';
import type { SessionUser } from '@/types';

export type DispatchListQuery = {
  page: number;
  pageSize: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  productId?: string;
  personId?: string;
  dispatchType?: string;
  status?: string;
  userId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export async function listDispatches(session: SessionUser, q: DispatchListQuery) {
  const conditions: SQL[] = [];
  if (q.dateFrom) conditions.push(gte(dispatches.dispatchDate, new Date(q.dateFrom)));
  if (q.dateTo) conditions.push(lte(dispatches.dispatchDate, new Date(q.dateTo)));
  if (q.productId) conditions.push(eq(dispatches.productId, q.productId));
  if (q.personId) conditions.push(eq(dispatches.personId, q.personId));
  if (q.dispatchType)
    conditions.push(
      eq(dispatches.dispatchType, q.dispatchType as (typeof dispatches.$inferSelect)['dispatchType'])
    );
  if (q.status)
    conditions.push(eq(dispatches.status, q.status as (typeof dispatches.$inferSelect)['status']));
  if (q.userId) conditions.push(eq(dispatches.userId, q.userId));

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const base = db
    .select({
      dispatch: dispatches,
      productName: products.name,
      genericName: products.genericName,
      productCategory: products.category,
      personName: persons.name,
      personCity: persons.city,
      personTerritory: persons.territory,
      assignedToUserId: persons.assignedToUserId,
      userName: users.name,
    })
    .from(dispatches)
    .innerJoin(products, eq(dispatches.productId, products.id))
    .innerJoin(persons, eq(dispatches.personId, persons.id))
    .innerJoin(users, eq(dispatches.userId, users.id))
    .$dynamic();

  const rowsAll = await base.where(whereClause).orderBy(desc(dispatches.dispatchDate));

  const filtered = rowsAll.filter((r) =>
    dispatchAccessible(
      session,
      r.personTerritory,
      r.assignedToUserId,
      r.dispatch.userId
    )
  );

  if (q.search) {
    const t = q.search.toLowerCase();
    const f = filtered.filter(
      (r) =>
        r.productName.toLowerCase().includes(t) ||
        r.personName.toLowerCase().includes(t) ||
        (r.userName?.toLowerCase().includes(t) ?? false)
    );
    return paginateDispatch(f, q);
  }

  return paginateDispatch(filtered, q);
}

function paginateDispatch<
  T extends {
    dispatch: (typeof dispatches.$inferSelect);
    productName: string;
    genericName: string;
    productCategory: (typeof products.$inferSelect)['category'];
    personName: string;
    personCity: string;
    personTerritory: string | null;
    assignedToUserId: string | null;
    userName: string | null;
  },
>(filtered: T[], q: DispatchListQuery) {
  const total = filtered.length;
  const sorted = [...filtered].sort((a, b) => {
    const diff = a.dispatch.dispatchDate.getTime() - b.dispatch.dispatchDate.getTime();
    return q.sortOrder === 'asc' ? diff : -diff;
  });
  const offset = (q.page - 1) * q.pageSize;
  const slice = sorted.slice(offset, offset + q.pageSize);
  return {
    items: slice.map((r) => ({
      ...r.dispatch,
      productName: r.productName,
      genericName: r.genericName,
      productCategory: r.productCategory,
      personName: r.personName,
      personCity: r.personCity,
      dispatchedByName: r.userName,
    })),
    total,
  };
}

export async function getDispatchById(session: SessionUser, id: string) {
  const [row] = await db
    .select({
      dispatch: dispatches,
      personTerritory: persons.territory,
      assignedToUserId: persons.assignedToUserId,
      productName: products.name,
      personName: persons.name,
      userName: users.name,
    })
    .from(dispatches)
    .innerJoin(products, eq(dispatches.productId, products.id))
    .innerJoin(persons, eq(dispatches.personId, persons.id))
    .innerJoin(users, eq(dispatches.userId, users.id))
    .where(eq(dispatches.id, id));

  if (!row) return null;
  if (
    !dispatchAccessible(
      session,
      row.personTerritory,
      row.assignedToUserId,
      row.dispatch.userId
    )
  ) {
    return null;
  }

  return {
    ...row.dispatch,
    productName: row.productName,
    personName: row.personName,
    dispatchedByName: row.userName,
  };
}

export async function createDispatch(session: SessionUser, input: CreateDispatchInput) {
  const person = await db.query.persons.findFirst({ where: eq(persons.id, input.personId) });
  if (!person) throw new Error('HCP not found');
  if (!canAccessPerson(session, person.territory, person.assignedToUserId)) {
    throw new Error('Forbidden');
  }

  const product = await db.query.products.findFirst({ where: eq(products.id, input.productId) });
  if (!product) throw new Error('Product not found');

  const userId = session.role === 'ADMIN' && input.userId ? input.userId : session.id;

  const outbound = input.dispatchType !== 'RETURN';
  if (outbound && product.stockQty < input.quantity) {
    throw new Error('Insufficient stock');
  }

  return await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(dispatches)
      .values({
        productId: input.productId,
        personId: input.personId,
        userId,
        dispatchType: input.dispatchType,
        quantity: input.quantity,
        batchNumber: input.batchNumber ?? null,
        dispatchDate: input.dispatchDate,
        expectedDeliveryDate: input.expectedDeliveryDate ?? null,
        actualDeliveryDate: input.actualDeliveryDate ?? null,
        status: input.status,
        invoiceNumber: input.invoiceNumber ?? null,
        totalValue: input.totalValue ? String(input.totalValue) : null,
        address: input.address ?? person.address,
        remarks: input.remarks ?? null,
      })
      .returning();

    const delta = outbound ? -input.quantity : input.quantity;
    await tx
      .update(products)
      .set({
        stockQty: sql`${products.stockQty} + ${delta}`,
        updatedAt: new Date(),
      })
      .where(eq(products.id, input.productId));

    return created;
  });
}

export async function updateDispatch(session: SessionUser, id: string, input: UpdateDispatchInput) {
  const existing = await db.query.dispatches.findFirst({ where: eq(dispatches.id, id) });
  if (!existing) return null;

  const person = await db.query.persons.findFirst({ where: eq(persons.id, existing.personId) });
  if (!person) return null;
  if (
    !dispatchAccessible(session, person.territory, person.assignedToUserId, existing.userId)
  ) {
    return null;
  }

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.batchNumber !== undefined) patch.batchNumber = input.batchNumber;
  if (input.dispatchDate !== undefined) patch.dispatchDate = input.dispatchDate;
  if (input.expectedDeliveryDate !== undefined)
    patch.expectedDeliveryDate = input.expectedDeliveryDate;
  if (input.actualDeliveryDate !== undefined) patch.actualDeliveryDate = input.actualDeliveryDate;
  if (input.status !== undefined) patch.status = input.status;
  if (input.invoiceNumber !== undefined) patch.invoiceNumber = input.invoiceNumber;
  if (input.totalValue !== undefined)
    patch.totalValue = input.totalValue ? String(input.totalValue) : null;
  if (input.address !== undefined) patch.address = input.address;
  if (input.remarks !== undefined) patch.remarks = input.remarks;
  if (session.role === 'ADMIN' && input.userId) patch.userId = input.userId;

  const [updated] = await db
    .update(dispatches)
    .set(patch as typeof dispatches.$inferInsert)
    .where(eq(dispatches.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteDispatch(session: SessionUser, id: string) {
  const existing = await db.query.dispatches.findFirst({ where: eq(dispatches.id, id) });
  if (!existing) return false;

  const person = await db.query.persons.findFirst({ where: eq(persons.id, existing.personId) });
  if (!person) return false;
  if (
    !dispatchAccessible(session, person.territory, person.assignedToUserId, existing.userId)
  ) {
    return false;
  }

  const product = await db.query.products.findFirst({ where: eq(products.id, existing.productId) });
  if (!product) return false;

  const outbound = existing.dispatchType !== 'RETURN';
  const delta = outbound ? existing.quantity : -existing.quantity;

  await db.transaction(async (tx) => {
    await tx.delete(dispatches).where(eq(dispatches.id, id));
    await tx
      .update(products)
      .set({
        stockQty: sql`${products.stockQty} + ${delta}`,
        updatedAt: new Date(),
      })
      .where(eq(products.id, existing.productId));
  });

  return true;
}

export async function listDispatchesForPerson(personId: string) {
  return db
    .select({
      dispatch: dispatches,
      productName: products.name,
      userName: users.name,
    })
    .from(dispatches)
    .innerJoin(products, eq(dispatches.productId, products.id))
    .innerJoin(users, eq(dispatches.userId, users.id))
    .where(eq(dispatches.personId, personId))
    .orderBy(desc(dispatches.dispatchDate));
}
