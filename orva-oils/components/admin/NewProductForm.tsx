'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function NewProductForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const priceNum = Number(price);
    const stockNum = Number(stock);
    if (!name.trim() || Number.isNaN(priceNum) || priceNum < 0) {
      setError('Enter a name and a valid price.');
      return;
    }
    if (Number.isNaN(stockNum) || stockNum < 0) {
      setError('Enter a valid stock count.');
      return;
    }

    setSaving(true);
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, price: priceNum, stock: stockNum, description: description || undefined }),
    });

    if (!res.ok) {
      setSaving(false);
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Failed to add product.');
      return;
    }

    const product = await res.json();

    if (photo) {
      const form = new FormData();
      form.append('file', photo);
      const imgRes = await fetch(`/api/products/${product.id}/image`, { method: 'POST', body: form });
      if (!imgRes.ok) {
        setSaving(false);
        const data = await imgRes.json().catch(() => ({}));
        setError(`Product added, but the photo failed to upload: ${data.error ?? 'unknown error'}`);
        router.refresh();
        return;
      }
    }

    setSaving(false);
    setName('');
    setPrice('');
    setStock('0');
    setDescription('');
    setPhoto(null);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 flex flex-wrap items-end gap-4"
    >
      <div className="flex-1 min-w-[180px]">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">
          Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-surface-container-low rounded-lg px-3 py-2.5 text-sm"
        />
      </div>
      <div className="w-28">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">
          Price (₹)
        </label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full bg-surface-container-low rounded-lg px-3 py-2.5 text-sm"
        />
      </div>
      <div className="w-24">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">
          Stock
        </label>
        <input
          type="number"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="w-full bg-surface-container-low rounded-lg px-3 py-2.5 text-sm"
        />
      </div>
      <div className="flex-1 min-w-[220px]">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">
          Description (optional)
        </label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-surface-container-low rounded-lg px-3 py-2.5 text-sm"
        />
      </div>
      <div className="w-40">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">
          Photo (optional)
        </label>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          className="w-full text-xs text-on-surface-variant file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-surface-container-low file:text-on-surface-variant"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="btn-primary px-6 py-2.5 rounded-lg font-bold text-sm disabled:opacity-60"
      >
        {saving ? 'Adding…' : 'Add Product'}
      </button>
      {error && <p className="text-error text-xs w-full">{error}</p>}
    </form>
  );
}
