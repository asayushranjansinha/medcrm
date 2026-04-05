import { and, asc, count, desc, eq, ilike, or, sql, SQL } from 'drizzle-orm';
import { db } from '@/lib/db';
import { dispatches, persons, products, users } from '@/lib/db/schema';
import type { CreateProductInput, UpdateProductInput } from '@/lib/validations/product';
import type { SessionUser } from '@/types';

const SORTABLE = {
  name: products.name,
  genericName: products.genericName,
  category: products.category,
  mrp: products.mrp,
  stockQty: products.stockQty,
  manufacturer: products.manufacturer,
  expiryDate: products.expiryDate,
  createdAt: products.createdAt,
} as const;

function escapeIlike(s: string) {
  return s.replace(/[%_\\]/g, '\\$&');
}

export type ProductListQuery = {
  page: number;
  pageSize: number;
  search?: string;
  category?: string;
  manufacturer?: string;
  stock?: string;
  isActive?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export async function listProducts(_session: SessionUser, q: ProductListQuery) {
  const conditions: SQL[] = [];

  if (q.search) {
    const t = `%${escapeIlike(q.search)}%`;
    const searchCond = or(
      ilike(products.name, t),
      ilike(products.genericName, t),
      ilike(products.manufacturer, t)
    );
    if (searchCond) conditions.push(searchCond);
  }
  if (q.category)
    conditions.push(eq(products.category, q.category as (typeof products.$inferSelect)['category']));
  if (q.manufacturer) conditions.push(ilike(products.manufacturer, `%${escapeIlike(q.manufacturer)}%`));
  if (q.stock === 'out') conditions.push(eq(products.stockQty, 0));
  if (q.stock === 'low') conditions.push(sql`${products.stockQty} > 0 and ${products.stockQty} < 10`);
  if (q.stock === 'in') conditions.push(sql`${products.stockQty} >= 10`);
  if (q.isActive === 'true') conditions.push(eq(products.isActive, true));
  if (q.isActive === 'false') conditions.push(eq(products.isActive, false));

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const [totalRow] = await db.select({ c: count() }).from(products).where(whereClause);
  const total = Number(totalRow?.c ?? 0);

  const sortCol =
    SORTABLE[(q.sortBy as keyof typeof SORTABLE) ?? 'name'] ?? products.name;
  const orderFn = q.sortOrder === 'desc' ? desc : asc;
  const offset = (q.page - 1) * q.pageSize;

  const rows = await db
    .select()
    .from(products)
    .where(whereClause)
    .orderBy(orderFn(sortCol))
    .limit(q.pageSize)
    .offset(offset);

  return { items: rows, total };
}

export async function getProductById(_session: SessionUser, id: string) {
  const row = await db.query.products.findFirst({ where: eq(products.id, id) });
  return row ?? null;
}

export async function createProduct(_session: SessionUser, input: CreateProductInput) {
  const [created] = await db
    .insert(products)
    .values({
      name: input.name,
      genericName: input.genericName,
      category: input.category,
      description: input.description || null,
      mrp: input.mrp,
      ptr: input.ptr,
      pts: input.pts ?? null,
      manufacturer: input.manufacturer,
      batchNumber: input.batchNumber ?? null,
      expiryDate: input.expiryDate,
      stockQty: input.stockQty,
      isActive: input.isActive ?? true,
    })
    .returning();

  return created;
}

export async function updateProduct(_session: SessionUser, id: string, input: UpdateProductInput) {
  const existing = await db.query.products.findFirst({ where: eq(products.id, id) });
  if (!existing) return null;

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) patch.name = input.name;
  if (input.genericName !== undefined) patch.genericName = input.genericName;
  if (input.category !== undefined) patch.category = input.category;
  if (input.description !== undefined) patch.description = input.description || null;
  if (input.mrp !== undefined) patch.mrp = input.mrp;
  if (input.ptr !== undefined) patch.ptr = input.ptr;
  if (input.pts !== undefined) patch.pts = input.pts ?? null;
  if (input.manufacturer !== undefined) patch.manufacturer = input.manufacturer;
  if (input.batchNumber !== undefined) patch.batchNumber = input.batchNumber ?? null;
  if (input.expiryDate !== undefined) patch.expiryDate = input.expiryDate;
  if (input.stockQty !== undefined) patch.stockQty = input.stockQty;
  if (input.isActive !== undefined) patch.isActive = input.isActive;

  const [updated] = await db
    .update(products)
    .set(patch as typeof products.$inferInsert)
    .where(eq(products.id, id))
    .returning();
  return updated ?? null;
}

export async function getProductDispatchTerritoryStats(productId: string) {
  const rows = await db
    .select({
      territory: persons.territory,
      totalQty: sql<number>`sum(${dispatches.quantity})::int`.mapWith(Number),
    })
    .from(dispatches)
    .innerJoin(persons, eq(dispatches.personId, persons.id))
    .where(eq(dispatches.productId, productId))
    .groupBy(persons.territory);

  return rows.filter((r) => r.territory != null) as { territory: string; totalQty: number }[];
}

export async function listDispatchesForProduct(productId: string) {
  return db
    .select({
      dispatch: dispatches,
      personName: persons.name,
      personCity: persons.city,
      userName: users.name,
    })
    .from(dispatches)
    .innerJoin(persons, eq(dispatches.personId, persons.id))
    .innerJoin(users, eq(dispatches.userId, users.id))
    .where(eq(dispatches.productId, productId))
    .orderBy(desc(dispatches.dispatchDate));
}
