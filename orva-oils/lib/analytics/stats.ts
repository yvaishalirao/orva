import { createAdminClient } from '@/lib/supabase/admin';

export interface PeriodStats { orders: number; revenue: number; }
export interface AnalyticsSummary { daily: PeriodStats; weekly: PeriodStats; monthly: PeriodStats; }

function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString(); }
function startOfMonth() { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d.toISOString(); }

async function periodStats(admin: ReturnType<typeof createAdminClient>, since: string): Promise<PeriodStats> {
  // INV-13: both filters required — succeeded payments, non-cancelled orders
  const { data, error } = await admin
    .from('orders')
    .select('total, payments!inner(status)')
    .gte('created_at', since)
    .eq('payments.status', 'succeeded')
    .neq('status', 'cancelled');

  if (error || !data) return { orders: 0, revenue: 0 };

  return {
    orders: data.length,
    revenue: data.reduce((sum, o) => sum + Number(o.total), 0),
  };
}

export async function getAnalytics(): Promise<AnalyticsSummary> {
  const admin = createAdminClient();

  const [daily, weekly, monthly] = await Promise.all([
    periodStats(admin, startOfToday()),
    periodStats(admin, daysAgo(7)),
    periodStats(admin, startOfMonth()),
  ]);

  return { daily, weekly, monthly };
}
