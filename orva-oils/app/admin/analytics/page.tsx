import { redirect } from 'next/navigation';
import { getAdminUser } from '@/lib/auth/adminGuard';
import { getAnalytics, type PeriodStats } from '@/lib/analytics/stats';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

function StatCard({ label, stats }: { label: string; stats: PeriodStats }) {
  return (
    <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">{label}</p>
      <p className="font-headline text-3xl font-extrabold text-primary mb-1">{fmt(stats.revenue)}</p>
      <p className="text-sm text-on-surface-variant">{stats.orders} order{stats.orders === 1 ? '' : 's'}</p>
    </div>
  );
}

export default async function AdminAnalyticsPage() {
  const admin = await getAdminUser();
  if (!admin) redirect('/admin/login');

  const { daily, weekly, monthly } = await getAnalytics();

  return (
    <main className="max-w-5xl mx-auto px-8 md:px-12 py-12">
      <h1 className="font-headline text-3xl font-extrabold text-primary mb-8">Analytics</h1>

      <div className="grid sm:grid-cols-3 gap-5">
        <StatCard label="Today" stats={daily} />
        <StatCard label="Last 7 Days" stats={weekly} />
        <StatCard label="This Month" stats={monthly} />
      </div>

      <p className="text-xs text-on-surface-variant mt-6">
        Includes only paid orders (payment succeeded) that have not been cancelled.
      </p>
    </main>
  );
}
