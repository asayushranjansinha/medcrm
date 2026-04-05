import { and, count, desc, eq, gte, lt, lte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { dispatches, persons, products, users, visits } from '@/lib/db/schema';
import {
  canAccessPerson,
  dispatchAccessible,
  personsVisibilityCondition,
  visitAccessible,
} from '@/lib/rbac';
import type { SessionUser } from '@/types';

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export async function getDashboardStats(session: SessionUser) {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const prevMonthStart = addMonths(thisMonthStart, -1);

  const pVis = personsVisibilityCondition(session);
  const personWhere = pVis ? and(eq(persons.isActive, true), pVis) : eq(persons.isActive, true);

  const [totalPersonsRow] = await db.select({ c: count() }).from(persons).where(personWhere);
  const totalPersons = Number(totalPersonsRow?.c ?? 0);

  const [newHcpThis] = await db
    .select({ c: count() })
    .from(persons)
    .where(
      pVis
        ? and(pVis, gte(persons.createdAt, thisMonthStart))
        : gte(persons.createdAt, thisMonthStart)
    );
  const [newHcpPrev] = await db
    .select({ c: count() })
    .from(persons)
    .where(
      pVis
        ? and(pVis, gte(persons.createdAt, prevMonthStart), lt(persons.createdAt, thisMonthStart))
        : and(gte(persons.createdAt, prevMonthStart), lt(persons.createdAt, thisMonthStart))
    );
  const hcpTrend = pctChange(Number(newHcpThis?.c ?? 0), Number(newHcpPrev?.c ?? 0));

  const visitRows = await db
    .select({
      visit: visits,
      territory: persons.territory,
      assignedTo: persons.assignedToUserId,
    })
    .from(visits)
    .innerJoin(persons, eq(visits.personId, persons.id))
    .where(
      and(
        eq(visits.status, 'COMPLETED'),
        gte(visits.visitDate, thisMonthStart),
        lte(visits.visitDate, now)
      )
    );
  const visitsThisMonth = visitRows.filter((r) =>
    visitAccessible(session, r.territory, r.assignedTo, r.visit.userId)
  ).length;

  const visitRowsPrev = await db
    .select({
      visit: visits,
      territory: persons.territory,
      assignedTo: persons.assignedToUserId,
    })
    .from(visits)
    .innerJoin(persons, eq(visits.personId, persons.id))
    .where(
      and(
        eq(visits.status, 'COMPLETED'),
        gte(visits.visitDate, prevMonthStart),
        lte(visits.visitDate, thisMonthStart)
      )
    );
  const visitsPrevMonth = visitRowsPrev.filter((r) =>
    visitAccessible(session, r.territory, r.assignedTo, r.visit.userId)
  ).length;

  const dispRows = await db
    .select({
      dispatch: dispatches,
      territory: persons.territory,
      assignedTo: persons.assignedToUserId,
    })
    .from(dispatches)
    .innerJoin(persons, eq(dispatches.personId, persons.id))
    .where(and(gte(dispatches.dispatchDate, thisMonthStart), lte(dispatches.dispatchDate, now)));
  const dispFiltered = dispRows.filter((r) =>
    dispatchAccessible(session, r.territory, r.assignedTo, r.dispatch.userId)
  );
  const dispatchesThisMonth = dispFiltered.reduce((s, r) => s + r.dispatch.quantity, 0);

  const dispRowsPrev = await db
    .select({
      dispatch: dispatches,
      territory: persons.territory,
      assignedTo: persons.assignedToUserId,
    })
    .from(dispatches)
    .innerJoin(persons, eq(dispatches.personId, persons.id))
    .where(
      and(
        gte(dispatches.dispatchDate, prevMonthStart),
        lte(dispatches.dispatchDate, thisMonthStart)
      )
    );
  const dispPrevFiltered = dispRowsPrev.filter((r) =>
    dispatchAccessible(session, r.territory, r.assignedTo, r.dispatch.userId)
  );
  const dispatchesPrevMonth = dispPrevFiltered.reduce((s, r) => s + r.dispatch.quantity, 0);

  const revRows = await db
    .select({
      visit: visits,
      territory: persons.territory,
      assignedTo: persons.assignedToUserId,
    })
    .from(visits)
    .innerJoin(persons, eq(visits.personId, persons.id))
    .where(
      and(
        eq(visits.status, 'COMPLETED'),
        eq(visits.orderTaken, true),
        gte(visits.visitDate, thisMonthStart),
        lte(visits.visitDate, now)
      )
    );
  const revFiltered = revRows.filter((r) =>
    visitAccessible(session, r.territory, r.assignedTo, r.visit.userId)
  );
  const revenueThisMonth = revFiltered.reduce(
    (s, r) => s + Number.parseFloat(String(r.visit.orderValue ?? 0)),
    0
  );

  const revRowsPrev = await db
    .select({
      visit: visits,
      territory: persons.territory,
      assignedTo: persons.assignedToUserId,
    })
    .from(visits)
    .innerJoin(persons, eq(visits.personId, persons.id))
    .where(
      and(
        eq(visits.status, 'COMPLETED'),
        eq(visits.orderTaken, true),
        gte(visits.visitDate, prevMonthStart),
        lte(visits.visitDate, thisMonthStart)
      )
    );
  const revPrevFiltered = revRowsPrev.filter((r) =>
    visitAccessible(session, r.territory, r.assignedTo, r.visit.userId)
  );
  const revenuePrevMonth = revPrevFiltered.reduce(
    (s, r) => s + Number.parseFloat(String(r.visit.orderValue ?? 0)),
    0
  );

  const monthlySalesTrend: { month: string; visitCount: number; orderValue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const mStart = addMonths(thisMonthStart, -i);
    const mEnd = addMonths(mStart, 1);
    const vRows = await db
      .select({
        visit: visits,
        territory: persons.territory,
        assignedTo: persons.assignedToUserId,
      })
      .from(visits)
      .innerJoin(persons, eq(visits.personId, persons.id))
      .where(
        and(
          eq(visits.status, 'COMPLETED'),
          gte(visits.visitDate, mStart),
          lte(visits.visitDate, mEnd)
        )
      );
    const vf = vRows.filter((r) =>
      visitAccessible(session, r.territory, r.assignedTo, r.visit.userId)
    );
    const orderSum = vf
      .filter((r) => r.visit.orderTaken)
      .reduce((s, r) => s + Number.parseFloat(String(r.visit.orderValue ?? 0)), 0);
    monthlySalesTrend.push({
      month: mStart.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
      visitCount: vf.length,
      orderValue: orderSum,
    });
  }

  const allDisp = await db
    .select({
      dispatch: dispatches,
      territory: persons.territory,
      assignedTo: persons.assignedToUserId,
    })
    .from(dispatches)
    .innerJoin(persons, eq(dispatches.personId, persons.id));

  const dispForTop = allDisp.filter((r) =>
    dispatchAccessible(session, r.territory, r.assignedTo, r.dispatch.userId)
  );
  const byProduct = new Map<string, number>();
  for (const r of dispForTop) {
    byProduct.set(
      r.dispatch.productId,
      (byProduct.get(r.dispatch.productId) ?? 0) + r.dispatch.quantity
    );
  }
  const topEntries = [...byProduct.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topProducts: { productId: string; name: string; totalQty: number }[] = [];
  for (const [pid, totalQty] of topEntries) {
    const p = await db.query.products.findFirst({ where: eq(products.id, pid) });
    if (p) topProducts.push({ productId: pid, name: p.name, totalQty });
  }

  const statusRows = await db
    .select({
      visit: visits,
      territory: persons.territory,
      assignedTo: persons.assignedToUserId,
    })
    .from(visits)
    .innerJoin(persons, eq(visits.personId, persons.id));

  const statusFiltered = statusRows.filter((r) =>
    visitAccessible(session, r.territory, r.assignedTo, r.visit.userId)
  );
  const visitStatusBreakdown = { PLANNED: 0, COMPLETED: 0, CANCELLED: 0 };
  for (const r of statusFiltered) {
    visitStatusBreakdown[r.visit.status]++;
  }

  const allPersonRows = pVis
    ? await db.select().from(persons).where(pVis)
    : await db.select().from(persons);
  const catDist = { A: 0, B: 0, C: 0 };
  for (const p of allPersonRows) {
    if (!canAccessPerson(session, p.territory, p.assignedToUserId)) continue;
    catDist[p.category]++;
  }

  const recentActivity = await buildRecentActivity(session);

  return {
    totalPersons,
    visitsThisMonth,
    dispatchesThisMonth,
    revenueThisMonth,
    trends: {
      totalPersonsPct: hcpTrend,
      visitsPct: pctChange(visitsThisMonth, visitsPrevMonth),
      dispatchesPct: pctChange(dispatchesThisMonth, dispatchesPrevMonth),
      revenuePct: pctChange(revenueThisMonth, revenuePrevMonth),
    },
    monthlySalesTrend,
    topProducts,
    visitStatusBreakdown,
    hcpCategoryDistribution: catDist,
    recentActivity,
  };
}

async function buildRecentActivity(session: SessionUser) {
  type Ev = { at: Date; label: string; detail: string; actor: string };
  const events: Ev[] = [];

  const vFull = await db
    .select({
      createdAt: visits.createdAt,
      actor: users.name,
      personName: persons.name,
      territory: persons.territory,
      assignedTo: persons.assignedToUserId,
      visitUserId: visits.userId,
    })
    .from(visits)
    .innerJoin(users, eq(visits.userId, users.id))
    .innerJoin(persons, eq(visits.personId, persons.id))
    .orderBy(desc(visits.createdAt))
    .limit(25);

  for (const row of vFull) {
    if (!visitAccessible(session, row.territory, row.assignedTo, row.visitUserId)) continue;
    events.push({
      at: row.createdAt,
      label: 'Visit logged',
      detail: row.personName,
      actor: row.actor ?? 'User',
    });
  }

  const dFull = await db
    .select({
      createdAt: dispatches.createdAt,
      actor: users.name,
      personName: persons.name,
      productName: products.name,
      territory: persons.territory,
      assignedTo: persons.assignedToUserId,
      dispatchUserId: dispatches.userId,
    })
    .from(dispatches)
    .innerJoin(users, eq(dispatches.userId, users.id))
    .innerJoin(persons, eq(dispatches.personId, persons.id))
    .innerJoin(products, eq(dispatches.productId, products.id))
    .orderBy(desc(dispatches.createdAt))
    .limit(25);

  for (const row of dFull) {
    if (!dispatchAccessible(session, row.territory, row.assignedTo, row.dispatchUserId)) continue;
    events.push({
      at: row.createdAt,
      label: 'Dispatch',
      detail: `${row.productName} → ${row.personName}`,
      actor: row.actor ?? 'User',
    });
  }

  const pFull = await db
    .select({
      createdAt: persons.createdAt,
      name: persons.name,
      territory: persons.territory,
      assignedTo: persons.assignedToUserId,
    })
    .from(persons)
    .orderBy(desc(persons.createdAt))
    .limit(25);

  for (const row of pFull) {
    if (!canAccessPerson(session, row.territory, row.assignedTo)) continue;
    events.push({
      at: row.createdAt,
      label: 'New HCP',
      detail: row.name,
      actor: 'System',
    });
  }

  events.sort((a, b) => b.at.getTime() - a.at.getTime());
  return events.slice(0, 10);
}
