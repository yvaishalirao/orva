import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

const STATUS_STEPS = ['pending', 'paid', 'confirmed', 'out_for_delivery', 'delivered'] as const;
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  confirmed: 'Confirmed',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
};

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(`/orders/${id}`)}`);

  // RLS scopes this to the authenticated customer's own orders — a wrong-user
  // or non-existent id returns no row here, which we treat as not found.
  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, status, total, created_at,
      order_items(quantity, unit_price, products(name)),
      addresses(name, phone, line1, line2, city, pincode, state)
    `)
    .eq('id', id)
    .single();

  if (!order) notFound();

  const currentIdx = order.status === 'cancelled' ? -1 : STATUS_STEPS.indexOf(order.status as any);
  const address = Array.isArray(order.addresses) ? order.addresses[0] : order.addresses;
  const items = (Array.isArray(order.order_items) ? order.order_items : []) as {
    quantity: number;
    unit_price: number;
    products: { name: string } | { name: string }[] | null;
  }[];

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

  return (
    <main className="max-w-4xl mx-auto px-8 md:px-12 py-12">
      <Link href="/account/orders" className="text-sm text-on-surface-variant hover:text-primary mb-8 inline-block">
        ← Your orders
      </Link>

      <h1 className="font-headline text-3xl font-extrabold text-primary mb-2">
        Order #{order.id.slice(-8).toUpperCase()}
      </h1>
      <p className="text-sm text-on-surface-variant mb-10">
        Placed on{' '}
        {new Date(order.created_at).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'long', year: 'numeric',
        })}
      </p>

      {/* Status pipeline */}
      {order.status === 'cancelled' ? (
        <p className="text-error font-semibold mb-10">Order Cancelled</p>
      ) : (
        <ol className="flex flex-wrap gap-4 mb-12">
          {STATUS_STEPS.map((step, i) => (
            <li
              key={step}
              className={`flex items-center gap-2 text-sm font-semibold ${
                i <= currentIdx ? 'text-primary' : 'text-on-surface-variant opacity-50'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  i <= currentIdx ? 'bg-primary text-white' : 'bg-surface-container-high'
                }`}
              >
                {i + 1}
              </span>
              {STATUS_LABELS[step]}
            </li>
          ))}
        </ol>
      )}

      <div className="grid md:grid-cols-2 gap-10">
        <section>
          <h2 className="font-headline font-bold text-lg mb-4">Items</h2>
          <div className="space-y-3">
            {items.map((item, i) => {
              const product = Array.isArray(item.products) ? item.products[0] : item.products;
              return (
                <div key={i} className="flex justify-between text-sm">
                  <span>{product?.name ?? 'Item'} × {item.quantity}</span>
                  <span className="font-semibold">{fmt(item.unit_price * item.quantity)}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between font-bold text-primary mt-4 pt-4 border-t border-surface-container-high">
            <span>Total</span>
            <span>{fmt(order.total)}</span>
          </div>
        </section>

        <section>
          <h2 className="font-headline font-bold text-lg mb-4">Delivery Address</h2>
          {address && (
            <div className="text-sm text-on-surface-variant space-y-1">
              <p className="text-on-surface font-semibold">{address.name}</p>
              <p>{address.phone}</p>
              <p>{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>
              <p>{address.city}, {address.state} {address.pincode}</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
