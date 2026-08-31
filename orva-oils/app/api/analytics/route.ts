import { requireAdmin } from '@/lib/auth/adminGuard';
import { getAnalytics } from '@/lib/analytics/stats';

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  return Response.json(await getAnalytics());
}
