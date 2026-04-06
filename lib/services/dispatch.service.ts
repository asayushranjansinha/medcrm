import { and, desc, eq, gte, lte, sql, SQL } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  dispatches,
  hospitalInventory,
  persons,
  products,
  stockistInventory,
  users,
} from '@/lib/db/schema';
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
  movementType?: string;
  status?: string;
  userId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

function normalizedMovementDate(d: Date): Date {
  const x = new Date(d);
  return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()));
}

type Mt = CreateDispatchInput['movementType'];

async function resolveMovementContext(session: SessionUser, input: CreateDispatchInput) {
  const mt = input.movementType;
  let fromEntityId = input.fromEntityId ?? null;
  let toEntityId = input.toEntityId ?? null;
  let fromEntityType = input.fromEntityType ?? null;
  let toEntityType = input.toEntityType ?? null;
  let remarks = input.remarks ?? null;

  if (mt === 'COMPANY_TO_STOCKIST') {
    fromEntityType = 'COMPANY';
    toEntityType = 'STOCKIST';
    toEntityId = toEntityId ?? input.personId ?? null;
  } else if (mt === 'STOCKIST_TO_HOSPITAL') {
    fromEntityType = 'STOCKIST';
    toEntityType = 'HOSPITAL';
  } else if (mt === 'STOCKIST_TO_RETAILER') {
    fromEntityType = 'STOCKIST';
    toEntityType = 'RETAILER';
    toEntityId = null;
    fromEntityId = fromEntityId ?? input.personId ?? null;
    if (input.toRetailerName) {
      remarks = [remarks, `Retailer: ${input.toRetailerName}`].filter(Boolean).join('\n');
    }
  } else if (mt === 'COMPANY_TO_HOSPITAL') {
    fromEntityType = 'COMPANY';
    toEntityType = 'HOSPITAL';
    toEntityId = toEntityId ?? input.personId ?? null;
  } else if (mt === 'SAMPLE_TO_DOCTOR') {
    const ep = await db.query.persons.findFirst({
      where: and(eq(persons.entityType, 'EMPLOYEE'), eq(persons.assignedToUserId, session.id)),
    });
    if (!ep) throw new Error('No employee profile linked to your user for MR dispatch');
    fromEntityId = ep.id;
    fromEntityType = 'MR';
    toEntityType = 'DOCTOR';
    toEntityId = toEntityId ?? input.personId ?? null;
  } else if (mt === 'RETURN_FROM_STOCKIST') {
    fromEntityType = 'STOCKIST';
    toEntityType = 'COMPANY';
    fromEntityId = fromEntityId ?? input.personId ?? null;
    toEntityId = null;
  } else if (mt === 'RETURN_FROM_HOSPITAL') {
    fromEntityType = 'HOSPITAL';
    toEntityType = 'STOCKIST';
    toEntityId = toEntityId ?? input.personId ?? null;
  } else if (mt === 'ADJUSTMENT') {
    fromEntityType = fromEntityType ?? null;
    toEntityType = toEntityType ?? null;
    if (!toEntityId && !fromEntityId && input.personId) {
      toEntityId = input.personId ?? null;
    }
  }

  const personId = resolvePersonId(mt, fromEntityId, toEntityId, input.personId ?? null);

  return {
    mt,
    fromEntityId,
    toEntityId,
    fromEntityType,
    toEntityType,
    remarks,
    personId,
  };
}

function resolvePersonId(
  mt: Mt,
  fromId: string | null,
  toId: string | null,
  fallback: string | null
) {
  switch (mt) {
    case 'COMPANY_TO_STOCKIST':
    case 'COMPANY_TO_HOSPITAL':
    case 'SAMPLE_TO_DOCTOR':
      return toId ?? fallback ?? '';
    case 'STOCKIST_TO_HOSPITAL':
      return toId ?? fallback ?? '';
    case 'STOCKIST_TO_RETAILER':
    case 'RETURN_FROM_STOCKIST':
      return fromId ?? fallback ?? '';
    case 'RETURN_FROM_HOSPITAL':
      return toId ?? fallback ?? '';
    case 'ADJUSTMENT':
    default:
      return toId ?? fromId ?? fallback ?? '';
  }
}

async function assertPersonEntity(id: string, expected: (typeof persons.$inferSelect)['entityType']) {
  const p = await db.query.persons.findFirst({ where: eq(persons.id, id) });
  if (!p) throw new Error('Referenced person not found');
  if (p.entityType !== expected) throw new Error(`Expected ${expected} for selected party`);
  return p;
}

async function getStockistQty(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  personId: string,
  productId: string
) {
  const [row] = await tx
    .select({ q: stockistInventory.currentQty })
    .from(stockistInventory)
    .where(
      and(eq(stockistInventory.personId, personId), eq(stockistInventory.productId, productId))
    );
  return row?.q ?? 0;
}

async function bumpStockist(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  personId: string,
  productId: string,
  delta: number,
  moveDate: Date
) {
  if (delta === 0) return;
  if (delta < 0) {
    const cur = await getStockistQty(tx, personId, productId);
    if (cur + delta < 0) throw new Error('Insufficient stockist stock');
  }
  await tx
    .insert(stockistInventory)
    .values({
      personId,
      productId,
      currentQty: delta > 0 ? delta : 0,
      lastMovementDate: moveDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [stockistInventory.personId, stockistInventory.productId],
      set: {
        currentQty: sql`${stockistInventory.currentQty} + ${delta}`,
        lastMovementDate: moveDate,
        updatedAt: new Date(),
      },
    });
}

async function bumpHospital(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  personId: string,
  productId: string,
  delta: number,
  moveDate: Date
) {
  if (delta === 0) return;
  if (delta < 0) {
    const [row] = await tx
      .select({ q: hospitalInventory.currentQty })
      .from(hospitalInventory)
      .where(
        and(eq(hospitalInventory.personId, personId), eq(hospitalInventory.productId, productId))
      );
    const cur = row?.q ?? 0;
    if (cur + delta < 0) throw new Error('Insufficient hospital stock');
  }
  await tx
    .insert(hospitalInventory)
    .values({
      personId,
      productId,
      currentQty: delta > 0 ? delta : 0,
      lastMovementDate: moveDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [hospitalInventory.personId, hospitalInventory.productId],
      set: {
        currentQty: sql`${hospitalInventory.currentQty} + ${delta}`,
        lastMovementDate: moveDate,
        updatedAt: new Date(),
      },
    });
}

async function applyInventoryAfterDispatch(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  mt: Mt,
  productId: string,
  qty: number,
  moveDate: Date,
  fromEntityId: string | null,
  toEntityId: string | null
) {
  if (mt === 'COMPANY_TO_STOCKIST' || mt === 'RETURN_FROM_HOSPITAL') {
    if (!toEntityId) throw new Error('Stockist recipient required');
    await assertPersonEntity(toEntityId, 'STOCKIST');
    await bumpStockist(tx, toEntityId, productId, qty, moveDate);
    if (mt === 'RETURN_FROM_HOSPITAL' && fromEntityId) {
      await assertPersonEntity(fromEntityId, 'HOSPITAL');
      await bumpHospital(tx, fromEntityId, productId, -qty, moveDate);
    }
  }

  if (mt === 'STOCKIST_TO_HOSPITAL' || mt === 'STOCKIST_TO_RETAILER') {
    if (!fromEntityId) throw new Error('Stockist source required');
    await assertPersonEntity(fromEntityId, 'STOCKIST');
    await bumpStockist(tx, fromEntityId, productId, -qty, moveDate);
    if (mt === 'STOCKIST_TO_HOSPITAL') {
      if (!toEntityId) throw new Error('Hospital recipient required');
      await assertPersonEntity(toEntityId, 'HOSPITAL');
      await bumpHospital(tx, toEntityId, productId, qty, moveDate);
    }
  }

  if (mt === 'COMPANY_TO_HOSPITAL') {
    if (!toEntityId) throw new Error('Hospital recipient required');
    await assertPersonEntity(toEntityId, 'HOSPITAL');
    await bumpHospital(tx, toEntityId, productId, qty, moveDate);
  }

  if (mt === 'RETURN_FROM_STOCKIST') {
    if (!fromEntityId) throw new Error('Stockist source required');
    await assertPersonEntity(fromEntityId, 'STOCKIST');
    await bumpStockist(tx, fromEntityId, productId, -qty, moveDate);
  }
}

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
  if (q.movementType)
    conditions.push(
      eq(
        dispatches.movementType,
        q.movementType as (typeof dispatches.$inferSelect)['movementType']
      )
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

function validateMovementParties(
  ctx: Awaited<ReturnType<typeof resolveMovementContext>>,
  input: CreateDispatchInput
) {
  const { mt, fromEntityId, toEntityId } = ctx;
  if (mt === 'STOCKIST_TO_HOSPITAL') {
    if (!fromEntityId || !toEntityId) throw new Error('Stockist and hospital are required');
  }
  if (mt === 'STOCKIST_TO_RETAILER' && !fromEntityId) {
    throw new Error('Stockist is required');
  }
  if (mt === 'RETURN_FROM_HOSPITAL') {
    if (!fromEntityId || !toEntityId) throw new Error('Hospital and stockist are required');
  }
  if (mt === 'COMPANY_TO_STOCKIST' || mt === 'COMPANY_TO_HOSPITAL') {
    if (!toEntityId) throw new Error('Recipient is required');
  }
  if (mt === 'ADJUSTMENT') {
    if (!fromEntityId && !toEntityId && !input.personId) {
      throw new Error('Select an anchor person for adjustment');
    }
  }
}

export async function createDispatch(session: SessionUser, input: CreateDispatchInput) {
  const ctx = await resolveMovementContext(session, input);
  validateMovementParties(ctx, input);
  if (!ctx.personId) throw new Error('Select all required parties for this movement type');
  const person = await db.query.persons.findFirst({ where: eq(persons.id, ctx.personId) });
  if (!person) throw new Error('Party not found');
  if (!canAccessPerson(session, person.territory, person.assignedToUserId)) {
    throw new Error('Forbidden');
  }

  const product = await db.query.products.findFirst({ where: eq(products.id, input.productId) });
  if (!product) throw new Error('Product not found');

  const userId = session.role === 'ADMIN' && input.userId ? input.userId : session.id;
  const moveDate = normalizedMovementDate(input.dispatchDate);

  const companyOutboundTypes: Mt[] = [
    'COMPANY_TO_STOCKIST',
    'COMPANY_TO_HOSPITAL',
    'SAMPLE_TO_DOCTOR',
  ];
  const companyInboundTypes: Mt[] = ['RETURN_FROM_STOCKIST'];

  if (companyOutboundTypes.includes(ctx.mt)) {
    if (product.stockQty < input.quantity) throw new Error('Insufficient stock');
  }

  return await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(dispatches)
      .values({
        movementType: ctx.mt,
        fromEntityId: ctx.fromEntityId,
        toEntityId: ctx.toEntityId,
        fromEntityType: ctx.fromEntityType,
        toEntityType: ctx.toEntityType,
        productId: input.productId,
        personId: ctx.personId,
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
        remarks: ctx.remarks,
      })
      .returning();

    if (companyOutboundTypes.includes(ctx.mt)) {
      await tx
        .update(products)
        .set({
          stockQty: sql`${products.stockQty} - ${input.quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(products.id, input.productId));
    } else if (companyInboundTypes.includes(ctx.mt)) {
      await tx
        .update(products)
        .set({
          stockQty: sql`${products.stockQty} + ${input.quantity}`,
          updatedAt: new Date(),
        })
        .where(eq(products.id, input.productId));
    }

    await applyInventoryAfterDispatch(
      tx,
      ctx.mt,
      input.productId,
      input.quantity,
      moveDate,
      ctx.fromEntityId,
      ctx.toEntityId
    );

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

export async function listDispatchesFromStockist(stockistPersonId: string) {
  return db
    .select({
      dispatch: dispatches,
      productName: products.name,
      userName: users.name,
    })
    .from(dispatches)
    .innerJoin(products, eq(dispatches.productId, products.id))
    .innerJoin(users, eq(dispatches.userId, users.id))
    .where(eq(dispatches.fromEntityId, stockistPersonId))
    .orderBy(desc(dispatches.dispatchDate));
}
