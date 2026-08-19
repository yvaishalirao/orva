import { createAdminClient } from '@/lib/supabase/admin';
import { sendOwnerOrderAlert } from '@/lib/notifications/email';
import { sendCustomerWhatsApp } from '@/lib/notifications/whatsapp';

export async function POST(request: Request) {
  const { orderId, event } = await request.json() as { orderId: string; event: string };
  const admin = createAdminClient();

  // CRITICAL: Look up contact details by order_id, not customer_id (INV-12)
  const { data } = await admin
    .from('orders')
    .select(`
      id, total, status,
      customers!inner(name, email),
      addresses!inner(phone)
    `)
    .eq('id', orderId)
    .single();

  if (!data) return Response.json({ error: 'Order not found' }, { status: 404 });

  const phone = (data as any).addresses.phone;
  const customerName = (data as any).customers.name;

  if (event === 'payment_confirmed') {
    await sendOwnerOrderAlert(orderId, (data as any).total, customerName);
    await sendCustomerWhatsApp(
      phone,
      `Hi ${customerName}, your Orva Oils order #${orderId.slice(-8).toUpperCase()} has been confirmed! Total: ₹${(data as any).total}.`
    );
  }

  if (event === 'status_update') {
    await sendCustomerWhatsApp(
      phone,
      `Hi ${customerName}, your order #${orderId.slice(-8).toUpperCase()} status: ${(data as any).status}.`
    );
    // Owner is NOT notified on status changes they initiate (INV-11)
  }

  return Response.json({ ok: true });
}
