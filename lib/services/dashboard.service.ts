import { and, count, desc, eq, gte, inArray, lt, lte } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/lib/db';
import {
  dispatches,
  monthlyTargets,
  persons,
  products,
  stockistInventory,
  users,
  visits,
} from '@/lib/db/schema';
import {
  canAccessPerson,
  dispatchAccessible,
  personsVisibilityCondition,
  visitAccessible,
} from '@/lib/rbac';
import type { SessionUser } from '@/types';

export type DashboardStats = {
  totalPersons: number;
  visitsThisMonth: number;
  dispatchesThisMonth: number;
  revenueThisMonth: number;
  trends: {
    totalPersonsPct: number;
    visitsPct: number;
    dispatchesPct: number;
    revenuePct: number;
  };
  monthlySalesTrend: { month: string; visitCount: number; orderValue: number }[];
  topProducts: { productId: string; name: string; totalQty: number }[];
  visitStatusBreakdown: Record<string, number>;
  hcpCategoryDistribution: Record<string, number>;
  recentActivity: { at: Date; label: string; detail: string; actor: string }[];
  lowStockAlerts: number;
  targetAchievementPctAvg: number;
  mrTargetVsAchievement: { mrName: string; target: number; achieved: number; pct: number }[];
  mrVisitCompletion: {
    mrName: string;
    planned: number;
    completed: number;
    missed: number;
    completionRate: number;
  }[];
  lowStockStockistLines: {
    stockistName: string;
    productName: string;
    currentQty: number;
    stockistId: string;
  }[];
  topStockists: { stockistName: string; totalValue: number; totalUnits: number }[];
  territoryRevenue: { territory: string; revenue: number }[];
  visitOutcomeTrend: {
    month: string;
    positive: number;
    neutral: number;
    negative: number;
    notMet: number;
  }[];
  prescriptionCommitmentRate: number;
};

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

export async function getDashboardStats(session: SessionUser): Promise<DashboardStats> {
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

  const lowInvRows = await db
    .select({
      territory: persons.territory,
      assignedTo: persons.assignedToUserId,
    })
    .from(stockistInventory)
    .innerJoin(persons, eq(stockistInventory.personId, persons.id))
    .where(
      and(lt(stockistInventory.currentQty, 10), eq(persons.entityType, 'STOCKIST'))
    );
  const lowStockAlerts = lowInvRows.filter((r) =>
    canAccessPerson(session, r.territory, r.assignedTo)
  ).length;

  const nowMonth = now.getMonth() + 1;
  const nowYear = now.getFullYear();
  const targetRowsMr = await db
    .select({
      target: monthlyTargets.targetValue,
      achieved: monthlyTargets.achievedValue,
      territory: persons.territory,
      assignedTo: persons.assignedToUserId,
    })
    .from(monthlyTargets)
    .innerJoin(persons, eq(monthlyTargets.employeeId, persons.id))
    .where(
      and(
        eq(monthlyTargets.month, nowMonth),
        eq(monthlyTargets.year, nowYear),
        eq(persons.entityType, 'EMPLOYEE'),
        eq(persons.salesRole, 'MR'),
        eq(persons.isActive, true)
      )
    );
  const targetFiltered = targetRowsMr.filter((r) =>
    canAccessPerson(session, r.territory, r.assignedTo)
  );
  const targetPcts = targetFiltered
    .map((r) => {
      const t = Number.parseFloat(String(r.target));
      const a = Number.parseFloat(String(r.achieved));
      return t > 0 ? (a / t) * 100 : null;
    })
    .filter((x): x is number => x != null);
  const targetAchievementPctAvg =
    targetPcts.length > 0
      ? Math.round((targetPcts.reduce((s, x) => s + x, 0) / targetPcts.length) * 10) / 10
      : 0;

  const mtAggRows = await db
    .select({
      employeeId: monthlyTargets.employeeId,
      target: monthlyTargets.targetValue,
      achieved: monthlyTargets.achievedValue,
      mrName: persons.name,
      territory: persons.territory,
      assignedTo: persons.assignedToUserId,
    })
    .from(monthlyTargets)
    .innerJoin(persons, eq(monthlyTargets.employeeId, persons.id))
    .where(
      and(
        eq(monthlyTargets.month, nowMonth),
        eq(monthlyTargets.year, nowYear),
        eq(persons.entityType, 'EMPLOYEE'),
        eq(persons.salesRole, 'MR'),
        eq(persons.isActive, true)
      )
    );

  const mrTargetMap = new Map<
    string,
    { mrName: string; target: number; achieved: number; territory: string | null; assignedTo: string | null }
  >();
  for (const r of mtAggRows) {
    if (!canAccessPerson(session, r.territory, r.assignedTo)) continue;
    const t = Number.parseFloat(String(r.target));
    const a = Number.parseFloat(String(r.achieved));
    const prev = mrTargetMap.get(r.employeeId);
    if (!prev) {
      mrTargetMap.set(r.employeeId, {
        mrName: r.mrName,
        target: t,
        achieved: a,
        territory: r.territory,
        assignedTo: r.assignedTo,
      });
    } else {
      prev.target += t;
      prev.achieved += a;
    }
  }
  const mrTargetVsAchievement = [...mrTargetMap.values()]
    .map((row) => {
      const { target, achieved } = row;
      const pct =
        target > 0 ? Math.round((achieved / target) * 100) : achieved > 0 ? 100 : 0;
      return { mrName: row.mrName, target, achieved, pct };
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 10);

  const vCompletionRows = await db
    .select({
      visit: visits,
      userName: users.name,
      userRole: users.role,
      territory: persons.territory,
      assignedTo: persons.assignedToUserId,
    })
    .from(visits)
    .innerJoin(users, eq(visits.userId, users.id))
    .innerJoin(persons, eq(visits.personId, persons.id))
    .where(and(gte(visits.visitDate, thisMonthStart), lte(visits.visitDate, now)));

  const mrVisitMap = new Map<
    string,
    { mrName: string; completed: number; missed: number; openPlanned: number }
  >();
  for (const r of vCompletionRows) {
    if (r.userRole !== 'MR') continue;
    if (!visitAccessible(session, r.territory, r.assignedTo, r.visit.userId)) continue;
    const uid = r.visit.userId;
    if (!mrVisitMap.has(uid)) {
      mrVisitMap.set(uid, { mrName: r.userName ?? 'MR', completed: 0, missed: 0, openPlanned: 0 });
    }
    const agg = mrVisitMap.get(uid)!;
    if (r.visit.status === 'COMPLETED') agg.completed++;
    else if (r.visit.status === 'CANCELLED') agg.missed++;
    else agg.openPlanned++;
  }
  const mrVisitCompletion = [...mrVisitMap.values()]
    .map((row) => {
      const planned = row.completed + row.missed + row.openPlanned;
      const completionRate =
        planned > 0 ? Math.round((row.completed / planned) * 100) : 0;
      return {
        mrName: row.mrName,
        planned,
        completed: row.completed,
        missed: row.missed,
        completionRate,
      };
    })
    .sort((a, b) => b.completionRate - a.completionRate);

  const lowInvDetailRows = await db
    .select({
      stockistId: stockistInventory.personId,
      stockistName: persons.name,
      productName: products.name,
      currentQty: stockistInventory.currentQty,
      territory: persons.territory,
      assignedTo: persons.assignedToUserId,
    })
    .from(stockistInventory)
    .innerJoin(persons, eq(stockistInventory.personId, persons.id))
    .innerJoin(products, eq(stockistInventory.productId, products.id))
    .where(
      and(lt(stockistInventory.currentQty, 10), eq(persons.entityType, 'STOCKIST'), eq(persons.isActive, true))
    );

  const lowStockStockistLines = lowInvDetailRows
    .filter((r) => canAccessPerson(session, r.territory, r.assignedTo))
    .sort((a, b) => a.currentQty - b.currentQty)
    .slice(0, 8)
    .map((r) => ({
      stockistName: r.stockistName,
      productName: r.productName,
      currentQty: r.currentQty,
      stockistId: r.stockistId,
    }));

  const stockDispatchRows = await db
    .select({
      dispatch: dispatches,
      territory: persons.territory,
      assignedTo: persons.assignedToUserId,
    })
    .from(dispatches)
    .innerJoin(persons, eq(dispatches.personId, persons.id))
    .where(
      and(
        inArray(dispatches.movementType, ['STOCKIST_TO_HOSPITAL', 'STOCKIST_TO_RETAILER']),
        gte(dispatches.dispatchDate, thisMonthStart),
        lte(dispatches.dispatchDate, now)
      )
    );

  const fromAgg = new Map<string, { totalValue: number; totalUnits: number }>();
  for (const r of stockDispatchRows) {
    if (!dispatchAccessible(session, r.territory, r.assignedTo, r.dispatch.userId)) continue;
    const fid = r.dispatch.fromEntityId;
    if (!fid) continue;
    const val = Number.parseFloat(String(r.dispatch.totalValue ?? 0));
    const prev = fromAgg.get(fid) ?? { totalValue: 0, totalUnits: 0 };
    prev.totalValue += val;
    prev.totalUnits += r.dispatch.quantity;
    fromAgg.set(fid, prev);
  }
  const fromIds = [...fromAgg.keys()];
  const stockistRowsForTop =
    fromIds.length > 0
      ? await db.query.persons.findMany({
          where: and(inArray(persons.id, fromIds), eq(persons.entityType, 'STOCKIST')),
        })
      : [];
  const stockistIdToName = new Map(stockistRowsForTop.map((p) => [p.id, p.name]));
  const topStockists = [...fromAgg.entries()]
    .filter(([id]) => stockistIdToName.has(id))
    .map(([id, a]) => ({
      stockistName: stockistIdToName.get(id)!,
      totalValue: a.totalValue,
      totalUnits: a.totalUnits,
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 6);

  const assignedUser = alias(users, 'assigned_user');
  const visitUserTbl = alias(users, 'visit_user');
  const terrRows = await db
    .select({
      visit: visits,
      assignedTerritory: assignedUser.territory,
      visitUserTerritory: visitUserTbl.territory,
      personTerritory: persons.territory,
      assignedTo: persons.assignedToUserId,
    })
    .from(visits)
    .innerJoin(persons, eq(visits.personId, persons.id))
    .leftJoin(assignedUser, eq(persons.assignedToUserId, assignedUser.id))
    .leftJoin(visitUserTbl, eq(visits.userId, visitUserTbl.id))
    .where(
      and(
        eq(visits.status, 'COMPLETED'),
        eq(visits.orderTaken, true),
        gte(visits.visitDate, thisMonthStart),
        lte(visits.visitDate, now)
      )
    );

  const terrTotals = new Map<string, number>();
  for (const r of terrRows) {
    if (!visitAccessible(session, r.personTerritory, r.assignedTo, r.visit.userId)) continue;
    const territory =
      (r.assignedTerritory && r.assignedTerritory.trim()) ||
      (r.visitUserTerritory && r.visitUserTerritory.trim()) ||
      'Unassigned';
    const rev = Number.parseFloat(String(r.visit.orderValue ?? 0));
    terrTotals.set(territory, (terrTotals.get(territory) ?? 0) + rev);
  }
  const territoryRevenue = [...terrTotals.entries()]
    .map(([territory, revenue]) => ({ territory, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  const sixMonthStart = addMonths(thisMonthStart, -5);
  const outcomeVisitRows = await db
    .select({
      visit: visits,
      territory: persons.territory,
      assignedTo: persons.assignedToUserId,
    })
    .from(visits)
    .innerJoin(persons, eq(visits.personId, persons.id))
    .where(and(gte(visits.visitDate, sixMonthStart), lte(visits.visitDate, now)));

  const monthWindows: { label: string; start: Date; end: Date }[] = [];
  for (let i = 5; i >= 0; i--) {
    const mStart = addMonths(thisMonthStart, -i);
    monthWindows.push({
      label: mStart.toLocaleString('en-US', { month: 'short' }),
      start: mStart,
      end: addMonths(mStart, 1),
    });
  }
  const visitOutcomeTrend = monthWindows.map((m) => ({
    month: m.label,
    positive: 0,
    neutral: 0,
    negative: 0,
    notMet: 0,
  }));
  for (const r of outcomeVisitRows) {
    if (!visitAccessible(session, r.territory, r.assignedTo, r.visit.userId)) continue;
    const d = r.visit.visitDate;
    const idx = monthWindows.findIndex((m) => d >= m.start && d < m.end);
    if (idx < 0) continue;
    const o = r.visit.outcome;
    if (o === 'POSITIVE') visitOutcomeTrend[idx].positive++;
    else if (o === 'NEUTRAL') visitOutcomeTrend[idx].neutral++;
    else if (o === 'NEGATIVE') visitOutcomeTrend[idx].negative++;
    else if (o === 'NOT_MET') visitOutcomeTrend[idx].notMet++;
  }

  const docVisitRows = await db
    .select({
      visit: visits,
      territory: persons.territory,
      assignedTo: persons.assignedToUserId,
    })
    .from(visits)
    .innerJoin(persons, eq(visits.personId, persons.id))
    .where(
      and(
        eq(visits.visitType, 'DOCTOR_VISIT'),
        eq(visits.status, 'COMPLETED'),
        gte(visits.visitDate, thisMonthStart),
        lte(visits.visitDate, now)
      )
    );
  let prescriptionCommitNumer = 0;
  let prescriptionCommitDenom = 0;
  for (const r of docVisitRows) {
    if (!visitAccessible(session, r.territory, r.assignedTo, r.visit.userId)) continue;
    prescriptionCommitDenom++;
    if (r.visit.prescriptionCommitment) prescriptionCommitNumer++;
  }
  const prescriptionCommitmentRate =
    prescriptionCommitDenom > 0
      ? Math.round((prescriptionCommitNumer / prescriptionCommitDenom) * 100)
      : 0;

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
    lowStockAlerts,
    targetAchievementPctAvg,
    mrTargetVsAchievement,
    mrVisitCompletion,
    lowStockStockistLines,
    topStockists,
    territoryRevenue,
    visitOutcomeTrend,
    prescriptionCommitmentRate,
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
