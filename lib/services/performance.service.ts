import { and, eq, gte, lte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { monthlyTargets, persons, visits } from '@/lib/db/schema';
import { canAccessPerson } from '@/lib/rbac';
import type { SessionUser } from '@/types';

export type PerformanceRow = {
  id: string;
  name: string;
  role: string | null;
  territory: string | null;
  targetInr: number;
  achievedInr: number;
  achievementPct: number;
  visitsThisMonth: number;
  completedVisits: number;
  ordersBooked: number;
};

export async function listFieldPerformance(session: SessionUser): Promise<PerformanceRow[]> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  const employees = await db
    .select()
    .from(persons)
    .where(and(eq(persons.entityType, 'EMPLOYEE'), eq(persons.isActive, true)));

  const visible = employees.filter((p) =>
    canAccessPerson(session, p.territory, p.assignedToUserId)
  );

  const out: PerformanceRow[] = [];

  for (const p of visible) {
    const targets = await db
      .select()
      .from(monthlyTargets)
      .where(
        and(
          eq(monthlyTargets.employeeId, p.id),
          eq(monthlyTargets.month, month),
          eq(monthlyTargets.year, year)
        )
      );

    const targetInr = targets.reduce((s, t) => s + Number(t.targetValue), 0);
    const achievedInr = targets.reduce((s, t) => s + Number(t.achievedValue), 0);
    const achievementPct =
      targetInr > 0 ? Math.round((achievedInr / targetInr) * 1000) / 10 : 0;

    let visitsThisMonth = 0;
    let completedVisits = 0;
    let ordersBooked = 0;

    if (p.assignedToUserId) {
      const vrows = await db
        .select()
        .from(visits)
        .where(
          and(
            eq(visits.userId, p.assignedToUserId),
            gte(visits.visitDate, monthStart),
            lte(visits.visitDate, monthEnd)
          )
        );
      visitsThisMonth = vrows.length;
      completedVisits = vrows.filter((v) => v.status === 'COMPLETED').length;
      ordersBooked = vrows.filter((v) => v.orderTaken).length;
    }

    out.push({
      id: p.id,
      name: p.name,
      role: p.salesRole,
      territory: p.territory,
      targetInr,
      achievedInr,
      achievementPct,
      visitsThisMonth,
      completedVisits,
      ordersBooked,
    });
  }

  return out.sort((a, b) => a.name.localeCompare(b.name));
}
