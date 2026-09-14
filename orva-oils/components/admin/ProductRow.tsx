'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  price: number;
  active: boolean;
  image_url: string | null;
  stock: number;
}

export default function ProductRow({ product }: { product: Product }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [price, setPrice] = useState(String(product.price));
  const [stock, setStock] = useState(String(product.stock));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file later
    if (!file) return;

    setError('');
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`/api/products/${product.id}/image`, { method: 'POST', body: form });
    setUploading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Image upload failed');
      return;
    }
    router.refresh();
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${product.name}" permanently? This cannot be undone.`)) return;

    setError('');
    setDeleting(true);
    const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
    setDeleting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Delete failed');
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-container-lowest border border-surface-container rounded-2xl px-6 py-4">
      <div className="flex items-center gap-4 flex-1 min-w-[220px]">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Change photo"
          className="relative w-14 h-14 shrink-0 rounded-xl bg-surface-container-high overflow-hidden flex items-center justify-center hover:opacity-80 disabled:opacity-50"
        >
          {product.image_url ? (
            <img src={product.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl select-none">🫙</span>
          )}
          {uploading && (
            <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[10px] font-bold">
              …
            </span>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleImagePick}
          className="hidden"
        />

        <div>
          <p className={`font-semibold ${product.active ? 'text-on-surface' : 'text-on-surface-variant line-through'}`}>
            {product.name}
          </p>
          {error && <p className="text-error text-[11px] mt-1">{error}</p>}
        </div>
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

      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">Stock</span>
        <input
          type="number"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          onBlur={() => {
            const n = Number(stock);
            if (!Number.isNaN(n) && n >= 0 && n !== product.stock) save({ stock: n });
          }}
          className={`w-16 bg-surface-container-low rounded-lg px-3 py-2 text-sm ${
            product.stock === 0 ? 'text-error font-semibold' : ''
          }`}
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

      <button
        onClick={handleDelete}
        disabled={deleting}
        aria-label={`Delete ${product.name}`}
        title="Delete permanently"
        className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors disabled:opacity-50"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7h16M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m3 0-1 13a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7h14zM10 11v6M14 11v6" />
        </svg>
      </button>
    </div>
  );
}
