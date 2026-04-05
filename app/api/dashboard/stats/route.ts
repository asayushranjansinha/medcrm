import { jsonError, jsonSuccess } from '@/lib/api/response';
import { getSessionUser } from '@/lib/api/session';
import { getDashboardStats } from '@/lib/services/dashboard.service';

export async function GET() {
  const session = await getSessionUser();
  if (!session) return jsonError('Unauthorized', 401);

  try {
    const stats = await getDashboardStats(session);
    return jsonSuccess(stats);
  } catch (e) {
    console.error(e);
    return jsonError('Failed to load dashboard', 500);
  }
}
