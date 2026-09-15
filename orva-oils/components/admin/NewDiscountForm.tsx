'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function NewDiscountForm() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percent' | 'fixed'>('percent');
  const [value, setValue] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiry, setExpiry] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const valueNum = Number(value);
    if (!code.trim() || Number.isNaN(valueNum) || valueNum <= 0) {
      setError('Enter a code and a positive value.');
      return;
    }

    setSaving(true);
    const res = await fetch('/api/discount-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        type,
        value: valueNum,
        max_uses: maxUses ? Number(maxUses) : undefined,
        expiry: expiry || undefined,
      }),
    });
    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Failed to create discount code.');
      return;
    }

    setCode('');
    setValue('');
    setMaxUses('');
    setExpiry('');
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 flex flex-wrap items-end gap-4"
    >
      <div className="w-40">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">
          Code
        </label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="WELCOME10"
          className="w-full bg-surface-container-low rounded-lg px-3 py-2.5 text-sm uppercase"
        />
      </div>

      <div className="w-32">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">
          Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as 'percent' | 'fixed')}
          className="w-full bg-surface-container-low rounded-lg px-3 py-2.5 text-sm"
        >
          <option value="percent">Percent %</option>
          <option value="fixed">Fixed ₹</option>
        </select>
      </div>

      <div className="w-24">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">
          Value
        </label>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={type === 'percent' ? '10' : '50'}
          className="w-full bg-surface-container-low rounded-lg px-3 py-2.5 text-sm"
        />
      </div>

      <div className="w-28">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">
          Max Uses
        </label>
        <input
          type="number"
          value={maxUses}
          onChange={(e) => setMaxUses(e.target.value)}
          placeholder="Unlimited"
          className="w-full bg-surface-container-low rounded-lg px-3 py-2.5 text-sm"
        />
      </div>

      <div className="w-40">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">
          Expiry (optional)
        </label>
        <input
          type="date"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
          className="w-full bg-surface-container-low rounded-lg px-3 py-2.5 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="btn-primary px-6 py-2.5 rounded-lg font-bold text-sm disabled:opacity-60"
      >
        {saving ? 'Adding…' : 'Add Code'}
      </button>
      {error && <p className="text-error text-xs w-full">{error}</p>}
    </form>
  );
}
