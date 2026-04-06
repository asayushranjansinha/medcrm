import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  dispatches,
  hospitalInventory,
  monthlyTargets,
  persons,
  products,
  stockistInventory,
} from '@/lib/db/schema';
import { canAccessPerson } from '@/lib/rbac';
import type { SessionUser } from '@/types';

export type StockStatus = 'OUT OF STOCK' | 'LOW' | 'ADEQUATE' | 'OVERSTOCKED';

export function stockStatusLabel(qty: number): StockStatus {
  if (qty === 0) return 'OUT OF STOCK';
  if (qty < 10) return 'LOW';
  if (qty <= 100) return 'ADEQUATE';
  return 'OVERSTOCKED';
}

export async function getStockistInventoryForPerson(session: SessionUser, personId: string) {
  const p = await db.query.persons.findFirst({ where: eq(persons.id, personId) });
  if (!p || p.entityType !== 'STOCKIST') return null;
  if (!canAccessPerson(session, p.territory, p.assignedToUserId)) return null;

  const rows = await db
    .select({
      inv: stockistInventory,
      productName: products.name,
    })
    .from(stockistInventory)
    .innerJoin(products, eq(stockistInventory.productId, products.id))
    .where(eq(stockistInventory.personId, personId))
    .orderBy(products.name);

  return rows.map((r) => ({
    productId: r.inv.productId,
    productName: r.productName,
    currentQty: r.inv.currentQty,
    lastMovementDate: r.inv.lastMovementDate,
    stockStatus: stockStatusLabel(r.inv.currentQty),
  }));
}

export async function getHospitalInventoryForPerson(session: SessionUser, personId: string) {
  const p = await db.query.persons.findFirst({ where: eq(persons.id, personId) });
  if (!p || p.entityType !== 'HOSPITAL') return null;
  if (!canAccessPerson(session, p.territory, p.assignedToUserId)) return null;

  const rows = await db
    .select({
      inv: hospitalInventory,
      productName: products.name,
    })
    .from(hospitalInventory)
    .innerJoin(products, eq(hospitalInventory.productId, products.id))
    .where(eq(hospitalInventory.personId, personId))
    .orderBy(products.name);

  return rows.map((r) => ({
    productId: r.inv.productId,
    productName: r.productName,
    currentQty: r.inv.currentQty,
    lastMovementDate: r.inv.lastMovementDate,
  }));
}

export async function getStockistSalesByMonth(session: SessionUser, stockistPersonId: string) {
  const p = await db.query.persons.findFirst({ where: eq(persons.id, stockistPersonId) });
  if (!p || p.entityType !== 'STOCKIST') return null;
  if (!canAccessPerson(session, p.territory, p.assignedToUserId)) return null;

  const rows = await db
    .select({
      dispatch: dispatches,
      productName: products.name,
    })
    .from(dispatches)
    .innerJoin(products, eq(dispatches.productId, products.id))
    .where(eq(dispatches.fromEntityId, stockistPersonId))
    .orderBy(desc(dispatches.dispatchDate));

  type G = { month: string; year: number; units: number; value: number };
  const map = new Map<string, G>();
  for (const r of rows) {
    const d = r.dispatch.dispatchDate;
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    const key = `${y}-${m}`;
    const prev = map.get(key) ?? { month: String(m), year: y, units: 0, value: 0 };
    prev.units += r.dispatch.quantity;
    prev.value += Number.parseFloat(String(r.dispatch.totalValue ?? 0));
    map.set(key, prev);
  }
  return [...map.values()].sort((a, b) =>
    a.year !== b.year ? b.year - a.year : Number(b.month) - Number(a.month)
  );
}

export async function getEmployeePerformanceData(session: SessionUser, employeePersonId: string) {
  const p = await db.query.persons.findFirst({ where: eq(persons.id, employeePersonId) });
  if (!p || p.entityType !== 'EMPLOYEE') return null;
  if (!canAccessPerson(session, p.territory, p.assignedToUserId)) return null;

  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear = now.getFullYear();

  const currentTargets = await db
    .select()
    .from(monthlyTargets)
    .where(
      and(
        eq(monthlyTargets.employeeId, employeePersonId),
        eq(monthlyTargets.month, curMonth),
        eq(monthlyTargets.year, curYear)
      )
    );

  const targetSum = currentTargets.reduce((s, t) => s + Number(t.targetValue), 0);
  const achievedSum = currentTargets.reduce((s, t) => s + Number(t.achievedValue), 0);

  const last6Desc = await db
    .select()
    .from(monthlyTargets)
    .where(eq(monthlyTargets.employeeId, employeePersonId))
    .orderBy(desc(monthlyTargets.year), desc(monthlyTargets.month))
    .limit(6);

  const last6 = [...last6Desc].reverse();

  return {
    currentMonth: curMonth,
    currentYear: curYear,
    targetInr: targetSum,
    achievedInr: achievedSum,
    achievementPct: targetSum > 0 ? Math.round((achievedSum / targetSum) * 1000) / 10 : 0,
    last6Months: last6.map((t) => ({
      month: t.month,
      year: t.year,
      target: Number(t.targetValue),
      achieved: Number(t.achievedValue),
    })),
  };
}
