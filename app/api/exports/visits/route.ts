import { NextRequest } from 'next/server';
import { format } from 'date-fns';
import { getSessionUser } from '@/lib/api/session';
import { parseSort } from '@/lib/api/query';
import { buildWorkbook } from '@/lib/exports/excel';
import { listVisits } from '@/lib/services/visit.service';

export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sp = req.nextUrl.searchParams;
  const { sortBy, sortOrder } = parseSort(sp);

  const { items } = await listVisits(session, {
    page: 1,
    pageSize: 20_000,
    search: sp.get('search') ?? undefined,
    dateFrom: sp.get('dateFrom') ?? undefined,
    dateTo: sp.get('dateTo') ?? undefined,
    userId: sp.get('userId') ?? undefined,
    purpose: sp.get('purpose') ?? undefined,
    status: sp.get('status') ?? undefined,
    city: sp.get('city') ?? undefined,
    sortBy,
    sortOrder,
  });

  const columns = [
    { key: 'sno', header: 'S.No', width: 6 },
    { key: 'personName', header: 'HCP Name', width: 22 },
    { key: 'personCity', header: 'HCP City', width: 14 },
    { key: 'personCategory', header: 'HCP Category', width: 12 },
    { key: 'mrName', header: 'MR Name', width: 20 },
    { key: 'visitDate', header: 'Visit Date', width: 14 },
    { key: 'purpose', header: 'Purpose', width: 16 },
    { key: 'productsDiscussed', header: 'Products Discussed', width: 28 },
    { key: 'samplesGiven', header: 'Samples Given', width: 24 },
    { key: 'feedback', header: 'Feedback', width: 28 },
    { key: 'orderTaken', header: 'Order Taken', width: 12 },
    { key: 'orderValue', header: 'Order Value', width: 12 },
    { key: 'nextVisitDate', header: 'Next Visit Date', width: 16 },
    { key: 'status', header: 'Status', width: 12 },
  ];

  const rows = items.map((v, i) => ({
    sno: i + 1,
    personName: v.personName,
    personCity: v.personCity,
    personCategory: v.personCategory,
    mrName: v.mrName ?? '',
    visitDate: format(v.visitDate, 'yyyy-MM-dd'),
    purpose: v.purpose,
    productsDiscussed: (v.productsDiscussed ?? []).join(', '),
    samplesGiven: JSON.stringify(v.samplesGiven ?? []),
    feedback: v.feedback ?? '',
    orderTaken: v.orderTaken ? 'Yes' : 'No',
    orderValue: v.orderValue ?? '',
    nextVisitDate: v.nextVisitDate ? format(v.nextVisitDate, 'yyyy-MM-dd') : '',
    status: v.status,
  }));

  const buffer = await buildWorkbook({
    title: 'Visits',
    sheetName: 'Visits',
    columns,
    rows,
  });

  const fname = `visits_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fname}"`,
    },
  });
}
