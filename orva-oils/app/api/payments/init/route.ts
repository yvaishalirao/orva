import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { razorpay } from '@/lib/razorpay/client';

export async function POST(request: Request) {
  const supabase = await createClient(); // Next.js 16: createClient is async
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorised' }, { status: 401 });

  const { orderId } = await request.json() as { orderId: string };

  const admin = createAdminClient();

  // Fetch order total from DB — never trust frontend amount (INV-04)
  const { data: order, error } = await admin
    .from('orders')
    .select('id, total, customer_id')
    .eq('id', orderId)
    .single();

  if (error || !order) return Response.json({ error: 'Order not found' }, { status: 404 });

  // Verify order belongs to this customer
  const { data: customer } = await admin.from('customers').select('id').eq('google_uid', user.id).single();
  if (!customer || order.customer_id !== customer.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Create Razorpay order — amount in paise (multiply by 100)
  const rpOrder = await razorpay.orders.create({
    amount: Math.round(order.total * 100),
    currency: 'INR',
    receipt: order.id,
  });

  // Store Razorpay order ID against our order — amount sourced from DB (INV-04)
  await admin.from('payments').insert({
    order_id: order.id,
    razorpay_order_id: rpOrder.id,
    status: 'pending',
    amount: order.total,
  });

  return Response.json({
    razorpayOrderId: rpOrder.id,
    amount: order.total,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}
