import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // ── Auth ──────────────────────────────────────────────────────────────────
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let razorpay_payment_id: string, razorpay_order_id: string, razorpay_signature: string, db_order_id: string;
  try {
    ({ razorpay_payment_id, razorpay_order_id, razorpay_signature, db_order_id } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !db_order_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // ── Verify HMAC-SHA256 signature ──────────────────────────────────────────
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: 'Signature mismatch — payment not verified' }, { status: 400 });
  }

  // ── Update payment + order status ─────────────────────────────────────────
  const { error: payErr } = await supabase
    .from('payments')
    .update({ razorpay_payment_id, status: 'paid' })
    .eq('razorpay_order_id', razorpay_order_id);

  if (payErr) {
    console.error('Failed to update payment record:', payErr);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }

  const { error: orderErr } = await supabase
    .from('orders')
    .update({ status: 'paid' })
    .eq('id', db_order_id);

  if (orderErr) {
    console.error('Failed to update order status:', orderErr);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }

  return NextResponse.json({ success: true, order_id: db_order_id });
}
