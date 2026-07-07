import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface CartItemInput { productId: string; quantity: number; }

export async function POST(request: Request) {
  const supabase = await createClient(); // Next.js 16: createClient is async
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorised' }, { status: 401 });

  const body = await request.json() as {
    items: CartItemInput[];
    address: { name: string; phone: string; line1: string; city: string; pincode: string; state: string };
    discountCode?: string;
  };

  const admin = createAdminClient();

  // Fetch ALL product records server-side — never trust client prices
  const productIds = body.items.map(i => i.productId);
  const { data: products, error: prodErr } = await admin
    .from('products')
    .select('id, price, active')
    .in('id', productIds);

  if (prodErr || !products) return Response.json({ error: 'Failed to fetch products' }, { status: 500 });

  // Validate every item is active
  for (const item of body.items) {
    const product = products.find(p => p.id === item.productId);
    if (!product || !product.active) {
      return Response.json({ error: `Product ${item.productId} is not available` }, { status: 400 });
    }
  }

  // Calculate subtotal using DB prices only
  let subtotal = body.items.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId)!;
    return sum + product.price * item.quantity;
  }, 0);

  // Apply discount if provided
  let discountCodeId: string | null = null;
  if (body.discountCode) {
    const { data: code } = await admin
      .from('discount_codes')
      .select('id, type, value, max_uses, uses_count, expiry, active')
      .eq('code', body.discountCode.toUpperCase())
      .single();

    if (code && code.active && (!code.expiry || new Date(code.expiry) > new Date())) {
      if (!code.max_uses || code.uses_count < code.max_uses) {
        const discount = code.type === 'percent'
          ? subtotal * (code.value / 100)
          : code.value;
        subtotal = Math.max(0, subtotal - discount); // INV-08: floor at 0
        discountCodeId = code.id;
      }
    }
  }

  const total = subtotal;

  // Get customer record
  const { data: customer } = await admin.from('customers').select('id').eq('google_uid', user.id).single();
  if (!customer) return Response.json({ error: 'Customer not found' }, { status: 404 });

  // Create order
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({ customer_id: customer.id, status: 'pending', total, discount_code_id: discountCodeId })
    .select('id')
    .single();

  if (orderErr || !order) return Response.json({ error: 'Failed to create order' }, { status: 500 });

  // Create order items with DB prices
  const orderItems = body.items.map(item => ({
    order_id: order.id,
    product_id: item.productId,
    quantity: item.quantity,
    unit_price: products.find(p => p.id === item.productId)!.price,
  }));

  await admin.from('order_items').insert(orderItems);

  // Create address
  await admin.from('addresses').insert({ order_id: order.id, ...body.address });

  return Response.json({ orderId: order.id, total });
}
