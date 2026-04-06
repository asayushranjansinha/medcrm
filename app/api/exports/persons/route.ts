import { NextRequest } from 'next/server';
import { format } from 'date-fns';
import { getSessionUser } from '@/lib/api/session';
import { parseSort } from '@/lib/api/query';
import { buildWorkbook } from '@/lib/exports/excel';
import { listPersons } from '@/lib/services/person.service';

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

  const { items } = await listPersons(session, {
    page: 1,
    pageSize: 20_000,
    search: sp.get('search') ?? undefined,
    city: sp.get('city') ?? undefined,
    state: sp.get('state') ?? undefined,
    designation: sp.get('designation') ?? undefined,
    hospitalType: sp.get('hospitalType') ?? undefined,
    category: sp.get('category') ?? undefined,
    assignedToUserId: sp.get('assignedToUserId') ?? undefined,
    isActive: sp.get('isActive') ?? undefined,
    entityType: sp.get('entityType') ?? undefined,
    sortBy,
    sortOrder,
  });

  const columns = [
    { key: 'sno', header: 'S.No', width: 6 },
    { key: 'name', header: 'Full Name', width: 24 },
    { key: 'entityType', header: 'Entity type', width: 12 },
    { key: 'salesRole', header: 'Sales role', width: 12 },
    { key: 'designation', header: 'Designation', width: 14 },
    { key: 'specialty', header: 'Specialty', width: 16 },
    { key: 'qualification', header: 'Qualification', width: 14 },
    { key: 'hospitalName', header: 'Hospital Name', width: 28 },
    { key: 'hospitalType', header: 'Hospital Type', width: 12 },
    { key: 'address', header: 'Address', width: 28 },
    { key: 'city', header: 'City', width: 12 },
    { key: 'state', header: 'State', width: 12 },
    { key: 'pincode', header: 'Pincode', width: 10 },
    { key: 'phone', header: 'Phone', width: 14 },
    { key: 'email', header: 'Email', width: 24 },
    { key: 'category', header: 'Category', width: 8 },
    { key: 'territory', header: 'Territory', width: 14 },
    { key: 'assignedMr', header: 'Assigned MR', width: 20 },
    { key: 'totalVisits', header: 'Total Visits', width: 12 },
    { key: 'lastVisitDate', header: 'Last Visit Date', width: 16 },
    { key: 'isActive', header: 'Active', width: 8 },
    { key: 'createdAt', header: 'Created Date', width: 16 },
  ];

  const rows = items.map((p, i) => ({
    sno: i + 1,
    name: p.name,
    entityType: p.entityType,
    salesRole: (p as { salesRole?: string | null }).salesRole ?? '',
    designation: p.designation,
    specialty: p.specialty ?? '',
    qualification: p.qualification ?? '',
    hospitalName: p.hospitalName,
    hospitalType: p.hospitalType,
    address: p.address ?? '',
    city: p.city,
    state: p.state,
    pincode: p.pincode ?? '',
    phone: p.phone,
    email: p.email ?? '',
    category: p.category,
    territory: p.territory ?? '',
    assignedMr: (p as { assignedMrName?: string | null }).assignedMrName ?? '',
    totalVisits: p.totalVisits,
    lastVisitDate: p.lastVisitDate ? format(p.lastVisitDate, 'yyyy-MM-dd') : '',
    isActive: p.isActive ? 'Yes' : 'No',
    createdAt: format(p.createdAt, 'yyyy-MM-dd'),
  }));

  const buffer = await buildWorkbook({
    title: 'Persons',
    sheetName: 'HCPs',
    columns,
    rows,
  });

  const fname = `persons_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fname}"`,
    },
  });
}
