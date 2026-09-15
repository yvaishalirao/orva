'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DiscountCode {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  expiry: string | null;
  max_uses: number | null;
  uses_count: number;
  active: boolean;
}

export default function DiscountRow({ code }: { code: DiscountCode }) {
  const router = useRouter();
  const [value, setValue] = useState(String(code.value));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isExpired = code.expiry ? new Date(code.expiry) < new Date() : false;

  async function save(patch: Record<string, unknown>) {
    setError('');
    setSaving(true);
    const res = await fetch(`/api/discount-codes/${code.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Update failed');
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-container-lowest border border-surface-container rounded-2xl px-6 py-4">
      <div className="min-w-[120px]">
        <p className={`font-bold font-mono ${code.active && !isExpired ? 'text-on-surface' : 'text-on-surface-variant line-through'}`}>
          {code.code}
        </p>
        {error && <p className="text-error text-[11px] mt-1">{error}</p>}
        {isExpired && <p className="text-error text-[11px] mt-1">Expired</p>}
      </div>

      <div className="flex items-center gap-2">
        {code.type === 'percent' && <span className="text-on-surface-variant text-sm">%</span>}
        {code.type === 'fixed' && <span className="text-on-surface-variant text-sm">₹</span>}
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => {
            const n = Number(value);
            if (!Number.isNaN(n) && n > 0 && n !== code.value) save({ value: n });
          }}
          className="w-20 bg-surface-container-low rounded-lg px-3 py-2 text-sm"
        />
        <span className="text-xs text-on-surface-variant">off</span>
      </div>

      <div className="text-xs text-on-surface-variant min-w-[80px]">
        {code.uses_count} / {code.max_uses ?? '∞'} used
      </div>

      <div className="text-xs text-on-surface-variant min-w-[100px]">
        {code.expiry ? `Expires ${new Date(code.expiry).toLocaleDateString('en-IN')}` : 'No expiry'}
      </div>

      <button
        onClick={() => save({ active: !code.active })}
        disabled={saving}
        className={`text-xs font-bold uppercase tracking-wide px-3 py-2 rounded-lg disabled:opacity-50 ${
          code.active ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary text-white'
        }`}
      >
        {saving ? '…' : code.active ? 'Deactivate' : 'Activate'}
      </button>
    </div>
  );
}
