import { requireAdmin } from '@/lib/auth/adminGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidTransition } from '@/lib/utils/orderStatus';

export async function PATCH(request: Request, ctx: RouteContext<'/api/orders/[id]/status'>) {
  // Admin check first (INV-05)
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  const { status: newStatus } = await request.json() as { status: string };
  const admin = createAdminClient();

  // Fetch current status
  const { data: order, error } = await admin
    .from('orders')
    .select('id, status')
    .eq('id', id)
    .single();

  if (error || !order) return Response.json({ error: 'Order not found' }, { status: 404 });

  // Validate transition (INV-07)
  if (!isValidTransition(order.status, newStatus)) {
    return Response.json(
      { error: `Invalid transition: ${order.status} → ${newStatus}` },
      { status: 400 }
    );
  }

  // Update status
  const { error: updateErr } = await admin
    .from('orders')
    .update({ status: newStatus })
    .eq('id', id);

  if (updateErr) return Response.json({ error: 'Update failed' }, { status: 500 });

  // Notify customer after successful DB write (INV-03, INV-11: no owner notification)
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: id, event: 'status_update' }),
    });
  } catch (e) {
    console.error('Notification failed:', e);
  }

  return Response.json({ ok: true, status: newStatus });
}
