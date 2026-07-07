import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { razorpay } from '@/lib/razorpay';

const GST_RATE = 0.05; // 5% — edible oils (HSN 1515)

interface CartItem {
  product_id: string;
  quantity: number;
}

interface Address {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // ── Auth ──────────────────────────────────────────────────────────────────
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let items: CartItem[], address: Address;
  try {
    ({ items, address } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!items?.length) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }
  if (!address?.name || !address?.phone || !address?.line1 || !address?.city || !address?.pincode || !address?.state) {
    return NextResponse.json({ error: 'Incomplete address' }, { status: 400 });
  }

  // ── Fetch prices from DB (INV-09: price must come from DB, never from client) ─
  const productIds = items.map((i) => i.product_id);
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('id, price, active')
    .in('id', productIds);

  if (prodErr || !products?.length) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }

  const priceMap = new Map(products.map((p) => [p.id, p]));

  // Validate all items exist and are active
  for (const item of items) {
    const p = priceMap.get(item.product_id);
    if (!p || !p.active) {
      return NextResponse.json({ error: `Product ${item.product_id} unavailable` }, { status: 400 });
    }
    if (item.quantity < 1 || item.quantity > 10) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }
  }

  // ── Calculate total server-side ───────────────────────────────────────────
  const subtotal = items.reduce((sum, item) => {
    const price = Number(priceMap.get(item.product_id)!.price);
    return sum + price * item.quantity;
  }, 0);
  const gstAmount = Math.round(subtotal * GST_RATE * 100) / 100;
  const total = Math.round((subtotal + gstAmount) * 100) / 100;
  const amountPaise = Math.round(total * 100); // Razorpay works in paise

  if (amountPaise < 100) {
    return NextResponse.json({ error: 'Order amount too small' }, { status: 400 });
  }

  // ── Upsert customer ───────────────────────────────────────────────────────
  const { data: customer, error: custErr } = await supabase
    .from('customers')
    .upsert(
      {
        google_uid: user.id,
        name: user.user_metadata?.full_name ?? address.name,
        email: user.email!,
      },
      { onConflict: 'google_uid' }
    )
    .select('id')
    .single();

  if (custErr || !customer) {
    return NextResponse.json({ error: 'Failed to resolve customer' }, { status: 500 });
  }

  // ── Create Razorpay order (before writing to DB, so we fail fast) ─────────
  let rzpOrder: { id: string; amount: number; currency: string };
  try {
    rzpOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    }) as typeof rzpOrder;
  } catch (err) {
    console.error('Razorpay order creation failed:', err);
    return NextResponse.json({ error: 'Payment gateway error' }, { status: 500 });
  }

  // ── Persist order + items + address + payment row ─────────────────────────
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({ customer_id: customer.id, total, status: 'pending' })
    .select('id')
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }

  await supabase.from('order_items').insert(
    items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: Number(priceMap.get(item.product_id)!.price),
    }))
  );

  await supabase.from('addresses').insert({
    order_id: order.id,
    name: address.name,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 ?? null,
    city: address.city,
    pincode: address.pincode,
    state: address.state,
  });

  await supabase.from('payments').insert({
    order_id: order.id,
    razorpay_order_id: rzpOrder.id,
    status: 'pending',
    amount: total,
  });

  return NextResponse.json({
    razorpay_order_id: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    db_order_id: order.id,
  });
}
