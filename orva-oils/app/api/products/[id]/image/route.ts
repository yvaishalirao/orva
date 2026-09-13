import { requireAdmin } from '@/lib/auth/adminGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import type { NextRequest } from 'next/server';

const BUCKET = 'product-images';
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

export async function POST(request: NextRequest, ctx: RouteContext<'/api/products/[id]/image'>) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  const form = await request.formData();
  const file = form.get('file');

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
  const ext = file.type.split('/')[1];
  const path = `${id}/${Date.now()}.${ext}`;

  const { error: uploadErr } = await admin.storage
    .from(BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: true });

  if (uploadErr) return Response.json({ error: 'Upload failed' }, { status: 500 });

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);

  const { data, error } = await admin
    .from('products')
    .update({ image_url: pub.publicUrl })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) return Response.json({ error: 'Failed to save image' }, { status: 500 });
  return Response.json(data);
}
