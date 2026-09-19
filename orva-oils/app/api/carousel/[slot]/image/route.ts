import { requireAdmin } from '@/lib/auth/adminGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import { CAROUSEL_SLOTS } from '@/lib/carousel';
import type { NextRequest } from 'next/server';

// Banner images share the existing public bucket, kept under a carousel/ prefix.
const BUCKET = 'product-images';
const PREFIX = 'carousel/';
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

function parseSlot(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= CAROUSEL_SLOTS ? n : null;
}

// Only ever deletes objects under carousel/ — never product photos.
function carouselPathFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  const path = decodeURIComponent(url.slice(i + marker.length));
  return path.startsWith(PREFIX) ? path : null;
}

export async function POST(request: NextRequest, ctx: RouteContext<'/api/carousel/[slot]/image'>) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const slot = parseSlot((await ctx.params).slot);
  if (!slot) return Response.json({ error: 'Invalid slot' }, { status: 400 });

  const file = (await request.formData()).get('file');
  if (!(file instanceof Blob) || file.size === 0) {
    return Response.json({ error: 'file is required' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json({ error: 'Unsupported image type — use PNG, JPEG, WebP, or GIF' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: 'Image must be under 5MB' }, { status: 400 });
  }

  const admin = createAdminClient();
  const key = `carousel_${slot}_image`;
  const { data: prev } = await admin.from('site_settings').select('value').eq('key', key).maybeSingle();

  const path = `${PREFIX}slot-${slot}-${Date.now()}.${file.type.split('/')[1]}`;
  const { error: uploadErr } = await admin.storage
    .from(BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type });
  if (uploadErr) return Response.json({ error: 'Upload failed' }, { status: 500 });

  const image = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const { error: saveErr } = await admin.from('site_settings').upsert({ key, value: image }, { onConflict: 'key' });
  if (saveErr) {
    await admin.storage.from(BUCKET).remove([path]);
    return Response.json({ error: 'Failed to save banner' }, { status: 500 });
  }

  // Replaced image is no longer referenced — best-effort cleanup.
  const oldPath = carouselPathFromUrl(prev?.value);
  if (oldPath) await admin.storage.from(BUCKET).remove([oldPath]);

  return Response.json({ image });
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/carousel/[slot]/image'>) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const slot = parseSlot((await ctx.params).slot);
  if (!slot) return Response.json({ error: 'Invalid slot' }, { status: 400 });

  const admin = createAdminClient();
  const key = `carousel_${slot}_image`;
  const { data: prev } = await admin.from('site_settings').select('value').eq('key', key).maybeSingle();

  const { error } = await admin.from('site_settings').upsert({ key, value: '' }, { onConflict: 'key' });
  if (error) return Response.json({ error: 'Failed to remove banner' }, { status: 500 });

  const oldPath = carouselPathFromUrl(prev?.value);
  if (oldPath) await admin.storage.from(BUCKET).remove([oldPath]);

  return Response.json({ ok: true });
}
