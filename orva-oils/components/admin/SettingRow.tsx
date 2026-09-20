'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingRow({
  settingKey,
  label,
  value: initialValue,
}: {
  settingKey: string;
  label: string;
  value: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setError('');
    setSaved(false);
    setSaving(true);
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: settingKey, value }),
    });
    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Failed to save.');
      return;
    }

    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6">
      <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
        {label}
      </label>
      <div className="flex gap-3">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 min-w-0 bg-surface-container-low rounded-lg px-3 py-2.5 text-sm"
        />
        <button
          onClick={save}
          disabled={saving}
          className="btn-primary px-5 py-2.5 rounded-lg font-bold text-sm disabled:opacity-60"
        >
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
        </button>
      </div>
      {error && <p className="text-error text-xs mt-2">{error}</p>}
    </div>
  );
}
