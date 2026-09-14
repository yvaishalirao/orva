import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import type { NextRequest } from 'next/server';

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/products/[id]'>) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, name, description, price, image_url, stock')
    .eq('id', id)
    .eq('active', true)
    .single();

  if (error || !data) return Response.json({ error: 'Product not found' }, { status: 404 });
  return Response.json(data);
}

export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/products/[id]'>) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  const body = await request.json() as Partial<{
    name: string; description: string; price: number; image_url: string; active: boolean; stock: number;
  }>;

  if (body.price !== undefined && (typeof body.price !== 'number' || body.price < 0)) {
    return Response.json({ error: 'price must be a non-negative number' }, { status: 400 });
  }
  if (body.stock !== undefined && (typeof body.stock !== 'number' || body.stock < 0)) {
    return Response.json({ error: 'stock must be a non-negative number' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('products')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) return Response.json({ error: 'Failed to update product' }, { status: 500 });
  return Response.json(data);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/products/[id]'>) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  const admin = createAdminClient();
  const { error } = await admin.from('products').delete().eq('id', id);

  if (error) {
    // Postgres 23503 = foreign_key_violation — product has order history, can't hard-delete
    if (error.code === '23503') {
      return Response.json(
        { error: 'This product has order history and cannot be deleted. Deactivate it instead.' },
        { status: 409 }
      );
    }
    return Response.json({ error: 'Failed to delete product' }, { status: 500 });
  }

  return Response.json({ ok: true });
}
