import { requireAdmin } from '@/lib/auth/adminGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('site_settings').select('key, value');

  if (error) return Response.json({ error: 'Failed to fetch settings' }, { status: 500 });
  return Response.json(data);
}

export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { key, value } = await request.json() as { key?: string; value?: string };
  if (!key || typeof value !== 'string') {
    return Response.json({ error: 'key and value are required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('site_settings')
    .upsert({ key, value }, { onConflict: 'key' })
    .select()
    .single();

  if (error || !data) return Response.json({ error: 'Failed to update setting' }, { status: 500 });
  return Response.json(data);
}
