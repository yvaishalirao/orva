'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CarouselSlotEditor({
  slot,
  image,
  caption: initialCaption,
}: {
  slot: number;
  image: string;
  caption: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState(initialCaption);
  const [busy, setBusy] = useState<'upload' | 'remove' | 'caption' | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    setBusy('upload');
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`/api/carousel/${slot}/image`, { method: 'POST', body: form });
    setBusy(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Upload failed');
      return;
    }
    router.refresh();
  }

  async function handleRemove() {
    if (!window.confirm(`Remove the image from banner ${slot}?`)) return;
    setError('');
    setBusy('remove');
    const res = await fetch(`/api/carousel/${slot}/image`, { method: 'DELETE' });
    setBusy(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Failed to remove');
      return;
    }
    router.refresh();
  }

  async function saveCaption() {
    setError('');
    setSaved(false);
    setBusy('caption');
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: `carousel_${slot}_caption`, value: caption }),
    });
    setBusy(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Failed to save caption');
      return;
    }
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-5 flex flex-wrap gap-5">
      <div className="w-full sm:w-56 shrink-0">
        <div className="aspect-[12/5] rounded-xl bg-surface-container-high overflow-hidden flex items-center justify-center">
          {image ? (
            <img src={image} alt={`Banner ${slot}`} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs text-on-surface-variant">No image</span>
          )}
        </div>
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy !== null}
            className="text-xs font-bold uppercase tracking-wide px-3 py-2 rounded-lg bg-primary text-white disabled:opacity-50"
          >
            {busy === 'upload' ? 'Uploading…' : image ? 'Replace' : 'Upload'}
          </button>
          {image && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy !== null}
              className="text-xs font-bold uppercase tracking-wide px-3 py-2 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-error disabled:opacity-50"
            >
              {busy === 'remove' ? '…' : 'Remove'}
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleFile}
          className="hidden"
          aria-label={`Upload image for banner ${slot}`}
        />
      </div>

      <div className="flex-1 min-w-[220px]">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
          Banner {slot} caption
        </label>
        <div className="flex gap-3">
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional headline shown over the image"
            className="flex-1 bg-surface-container-low rounded-lg px-3 py-2.5 text-sm"
          />
          <button
            type="button"
            onClick={saveCaption}
            disabled={busy !== null}
            className="btn-primary px-5 py-2.5 rounded-lg font-bold text-sm disabled:opacity-60"
          >
            {busy === 'caption' ? 'Saving…' : saved ? 'Saved' : 'Save'}
          </button>
        </div>
        {error && <p className="text-error text-xs mt-2">{error}</p>}
      </div>
    </div>
  );
}
