import { jsonError, jsonSuccess } from '@/lib/api/response';
import { getSessionUser } from '@/lib/api/session';
import { listFieldPerformance } from '@/lib/services/performance.service';

export async function GET() {
  const session = await getSessionUser();
  if (!session) return jsonError('Unauthorized', 401);
  try {
    const rows = await listFieldPerformance(session);
    return jsonSuccess(rows);
  } catch (e) {
    console.error(e);
    return jsonError('Failed to load performance', 500);
  }
}
