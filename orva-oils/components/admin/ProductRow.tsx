'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  price: number;
  active: boolean;
}

export default function ProductRow({ product }: { product: Product }) {
  const router = useRouter();
  const [price, setPrice] = useState(String(product.price));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save(patch: Record<string, unknown>) {
    setError('');
    setSaving(true);
    const res = await fetch(`/api/products/${product.id}`, {
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
      <div className="flex-1 min-w-[140px]">
        <p className={`font-semibold ${product.active ? 'text-on-surface' : 'text-on-surface-variant line-through'}`}>
          {product.name}
        </p>
        {error && <p className="text-error text-[11px] mt-1">{error}</p>}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-on-surface-variant text-sm">₹</span>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          onBlur={() => {
            const n = Number(price);
            if (!Number.isNaN(n) && n >= 0 && n !== product.price) save({ price: n });
          }}
          className="w-24 bg-surface-container-low rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <button
        onClick={() => save({ active: !product.active })}
        disabled={saving}
        className={`text-xs font-bold uppercase tracking-wide px-3 py-2 rounded-lg disabled:opacity-50 ${
          product.active ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary text-white'
        }`}
      >
        {saving ? '…' : product.active ? 'Deactivate' : 'Activate'}
      </button>
    </div>
  );
}
