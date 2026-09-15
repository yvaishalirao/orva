import { requireAdmin } from '@/lib/auth/adminGuard';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('discount_codes')
    .select('id, code, type, value, expiry, max_uses, uses_count, active')
    .order('code');

  if (error) return Response.json({ error: 'Failed to fetch discount codes' }, { status: 500 });
  return Response.json(data);
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const body = await request.json() as {
    code?: string;
    type?: 'percent' | 'fixed';
    value?: number;
    max_uses?: number | null;
    expiry?: string | null;
  };

  const code = body.code?.trim().toUpperCase();

  if (!code) {
    return Response.json({ error: 'code is required' }, { status: 400 });
  }
  if (body.type !== 'percent' && body.type !== 'fixed') {
    return Response.json({ error: "type must be 'percent' or 'fixed'" }, { status: 400 });
  }
  if (typeof body.value !== 'number' || body.value <= 0) {
    return Response.json({ error: 'value must be a positive number' }, { status: 400 });
  }
  if (body.max_uses != null && (typeof body.max_uses !== 'number' || body.max_uses <= 0)) {
    return Response.json({ error: 'max_uses must be a positive number, or omitted for unlimited' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('discount_codes')
    .insert({
      code,
      type: body.type,
      value: body.value,
      max_uses: body.max_uses ?? null,
      expiry: body.expiry || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return Response.json({ error: `Code "${code}" already exists` }, { status: 409 });
    }
    return Response.json({ error: 'Failed to create discount code' }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}
