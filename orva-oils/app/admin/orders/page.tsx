import { redirect } from 'next/navigation';
import { getAdminUser } from '@/lib/auth/adminGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import StatusUpdater from '@/components/admin/StatusUpdater';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  confirmed: 'Confirmed',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default async function AdminOrdersPage() {
  const admin = await getAdminUser();
  if (!admin) redirect('/admin/login');

  const supabaseAdmin = createAdminClient();
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('id, status, total, created_at, customers(name, email)')
    .order('created_at', { ascending: false });

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

  return (
    <main className="max-w-6xl mx-auto px-8 md:px-12 py-12">
      <h1 className="font-headline text-3xl font-extrabold text-primary mb-8">Orders</h1>

      {!orders?.length ? (
        <p className="text-on-surface-variant">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers;
            return (
              <div
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-4 bg-surface-container-lowest border border-surface-container rounded-2xl px-6 py-5"
              >
                <div>
                  <p className="font-semibold text-on-surface">Order #{order.id.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {customer?.name ?? 'Unknown'} ·{' '}
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                  <span className="font-bold text-primary">{fmt(order.total)}</span>
                  <StatusUpdater orderId={order.id} status={order.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
