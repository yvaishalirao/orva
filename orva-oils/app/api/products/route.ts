import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/adminGuard';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('id, name, description, price, image_url')
    .eq('active', true)
    .order('name');

  if (error) return Response.json({ error: 'Failed to fetch products' }, { status: 500 });
  return Response.json(data);
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { name, description, price, image_url } = await request.json() as {
    name?: string; description?: string; price?: number; image_url?: string;
  };

  if (!name?.trim() || typeof price !== 'number' || price < 0) {
    return Response.json({ error: 'name and a non-negative price are required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('products')
    .insert({ name: name.trim(), description: description?.trim() || null, price, image_url: image_url?.trim() || null })
    .select()
    .single();

  if (error || !data) return Response.json({ error: 'Failed to create product' }, { status: 500 });
  return Response.json(data, { status: 201 });
}
