import { requireAdmin } from '@/lib/auth/adminGuard';

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  return Response.json({ message: 'admin analytics placeholder' });
}
