'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function NewProductForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const priceNum = Number(price);
    if (!name.trim() || Number.isNaN(priceNum) || priceNum < 0) {
      setError('Enter a name and a valid price.');
      return;
    }

    setSaving(true);
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, price: priceNum, description: description || undefined }),
    });
    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Failed to add product.');
      return;
    }

    setName('');
    setPrice('');
    setDescription('');
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
