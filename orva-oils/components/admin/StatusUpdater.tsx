'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STATUS_SEQUENCE = ['paid', 'confirmed', 'out_for_delivery', 'delivered'] as const;
const LABELS: Record<string, string> = {
  paid: 'Paid',
  confirmed: 'Confirmed',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
};

export default function StatusUpdater({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const idx = STATUS_SEQUENCE.indexOf(status as (typeof STATUS_SEQUENCE)[number]);
  const next = idx >= 0 && idx < STATUS_SEQUENCE.length - 1 ? STATUS_SEQUENCE[idx + 1] : null;

  if (!next) return null;

  async function advance() {
    setError('');
    setLoading(true);
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Update failed');
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={advance}
        disabled={loading}
        className="text-xs font-bold uppercase tracking-wide px-3 py-2 rounded-lg bg-primary text-white disabled:opacity-50 whitespace-nowrap"
      >
        {loading ? '…' : `Mark ${LABELS[next]}`}
      </button>
      {error && <p className="text-error text-[11px] mt-1">{error}</p>}
    </div>
  );
}
