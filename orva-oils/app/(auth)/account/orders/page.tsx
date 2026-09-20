import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  confirmed: 'Confirmed',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default async function OrderHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="max-w-md mx-auto px-8 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-primary-container/10 text-primary-container flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
        </div>
        <h1 className="font-headline text-3xl font-bold text-primary mb-2">Your orders</h1>
        <p className="text-on-surface-variant text-sm mb-8">
          Login to see your orders and track their status.
        </p>
        <Link
          href="/auth/login?next=/account/orders"
          className="btn-primary inline-block px-10 py-3.5 rounded-sm font-bold text-xs uppercase tracking-wider"
        >
          Login / Signup
        </Link>
      </main>
    );
  }

  // RLS scopes this select to the authenticated customer's own orders (INV-06)
  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total, created_at')
    .order('created_at', { ascending: false });

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

  return (
    <main className="max-w-4xl mx-auto px-8 md:px-12 py-12">
      <h1 className="font-headline text-3xl font-extrabold text-primary mb-10">Your Orders</h1>

      {!orders?.length ? (
        <p className="text-on-surface-variant">You haven&apos;t placed any orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex items-center justify-between bg-surface-container-lowest border border-surface-container rounded-2xl px-6 py-5 hover:border-primary/30 transition-colors"
            >
              <div>
                <p className="font-semibold text-on-surface">Order #{order.id.slice(-8).toUpperCase()}</p>
                <p className="text-xs text-on-surface-variant mt-1">
                  {new Date(order.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">{fmt(order.total)}</p>
                <p className="text-xs text-on-surface-variant mt-1">
                  {STATUS_LABELS[order.status] ?? order.status}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
