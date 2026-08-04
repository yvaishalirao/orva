import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

// App Router reads raw body via request.text() natively; this export is inert but kept per spec
export const config = { api: { bodyParser: false } };

export async function POST(request: Request) {
  // Step 1: Signature verification MUST be first — before any DB operation (INV-01)
  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature');
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;

  if (!signature) return new Response('Missing signature', { status: 400 });

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  // timingSafeEqual throws on length mismatch — compare lengths first
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return new Response('Invalid signature', { status: 400 });
  }

  // Signature verified — now parse the payload
  const payload = JSON.parse(rawBody);
  if (payload.event !== 'payment.captured') {
    return new Response('Event ignored', { status: 200 });
  }

  const { razorpay_payment_id, razorpay_order_id, amount } =
    payload.payload.payment.entity;

  const admin = createAdminClient();

  // Step 2: Idempotency check — reject duplicate payment IDs (INV-02)
  const { data: existing } = await admin
    .from('payments')
    .select('id')
    .eq('razorpay_payment_id', razorpay_payment_id)
    .maybeSingle();

  if (existing) return new Response('Duplicate payment', { status: 200 });

  // Step 3: Update payment record and mark order as paid
  // CRITICAL: notifications only fire after successful DB write (INV-03)
  const { data: payment, error: payErr } = await admin
    .from('payments')
    .update({
      razorpay_payment_id,
      status: 'succeeded',
      amount: amount / 100, // Razorpay sends paise — convert to rupees (INV-04)
    })
    .eq('razorpay_order_id', razorpay_order_id)
    .select('order_id')
    .single();

  if (payErr || !payment) return new Response('Payment record not found', { status: 500 });

  const { error: orderErr } = await admin
    .from('orders')
    .update({ status: 'paid' })
    .eq('id', payment.order_id);

  if (orderErr) return new Response('Failed to update order', { status: 500 });

  // Step 4: Trigger notifications ONLY after successful DB writes (INV-03)
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: payment.order_id, event: 'payment_confirmed' }),
    });
  } catch (e) {
    // Notification failure must NOT cause the webhook to return non-200.
    // Razorpay retries on non-200 which could duplicate order state changes.
    console.error('Notification failed:', e);
  }

  return new Response('OK', { status: 200 });
}
