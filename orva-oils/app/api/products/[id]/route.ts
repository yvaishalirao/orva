import { createClient } from '@/lib/supabase/server';
import type { NextRequest } from 'next/server';

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/products/[id]'>) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, name, description, price, image_url')
    .eq('id', id)
    .eq('active', true)
    .single();

  if (error || !data) return Response.json({ error: 'Product not found' }, { status: 404 });
  return Response.json(data);
}
