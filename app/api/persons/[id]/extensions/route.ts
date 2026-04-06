import { NextRequest } from 'next/server';
import { jsonError, jsonSuccess } from '@/lib/api/response';
import { getSessionUser } from '@/lib/api/session';
import {
  getEmployeePerformanceData,
  getHospitalInventoryForPerson,
  getStockistInventoryForPerson,
  getStockistSalesByMonth,
} from '@/lib/services/person-extensions.service';
import { getPersonById } from '@/lib/services/person.service';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await getSessionUser();
  if (!session) return jsonError('Unauthorized', 401);
  const { id } = await ctx.params;

  const person = await getPersonById(session, id);
  if (!person) return jsonError('Not found', 404);

  const entityType = person.entityType;

  if (entityType === 'STOCKIST') {
    const inventory = await getStockistInventoryForPerson(session, id);
    const salesByMonth = await getStockistSalesByMonth(session, id);
    return jsonSuccess({ entityType, inventory, salesByMonth });
  }

  if (entityType === 'HOSPITAL') {
    const inventory = await getHospitalInventoryForPerson(session, id);
    return jsonSuccess({ entityType, inventory });
  }

  if (entityType === 'EMPLOYEE') {
    const performance = await getEmployeePerformanceData(session, id);
    return jsonSuccess({ entityType, performance });
  }

  return jsonSuccess({ entityType: 'DOCTOR' as const, extras: null });
}
