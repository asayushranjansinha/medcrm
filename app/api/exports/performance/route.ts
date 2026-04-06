import { format } from 'date-fns';
import { getSessionUser } from '@/lib/api/session';
import { buildWorkbook } from '@/lib/exports/excel';
import { listFieldPerformance } from '@/lib/services/performance.service';

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rows = await listFieldPerformance(session);

  const columns = [
    { key: 'sno', header: 'S.No', width: 6 },
    { key: 'name', header: 'Name', width: 22 },
    { key: 'role', header: 'Role', width: 10 },
    { key: 'territory', header: 'Territory', width: 16 },
    { key: 'targetInr', header: 'Target (INR)', width: 14 },
    { key: 'achievedInr', header: 'Achieved (INR)', width: 14 },
    { key: 'achievementPct', header: 'Achievement %', width: 14 },
    { key: 'visitsThisMonth', header: 'Visits this month', width: 16 },
    { key: 'completedVisits', header: 'Completed visits', width: 16 },
    { key: 'ordersBooked', header: 'Orders booked', width: 14 },
  ];

  const sheetRows = rows.map((r, i) => ({
    sno: i + 1,
    name: r.name,
    role: r.role ?? '',
    territory: r.territory ?? '',
    targetInr: r.targetInr,
    achievedInr: r.achievedInr,
    achievementPct: r.achievementPct,
    visitsThisMonth: r.visitsThisMonth,
    completedVisits: r.completedVisits,
    ordersBooked: r.ordersBooked,
  }));

  const buffer = await buildWorkbook({
    title: 'Field performance',
    sheetName: 'Performance',
    columns,
    rows: sheetRows,
  });

  const fname = `performance_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fname}"`,
    },
  });
}
