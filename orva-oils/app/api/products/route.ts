import { createClient } from '@/lib/supabase/server';

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
