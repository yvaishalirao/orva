import { requireAdmin } from '@/lib/auth/adminGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import type { NextRequest } from 'next/server';

export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/discount-codes/[id]'>) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  const body = await request.json() as Partial<{
    value: number;
    max_uses: number | null;
    expiry: string | null;
    active: boolean;
  }>;

  if (body.value !== undefined && (typeof body.value !== 'number' || body.value <= 0)) {
    return Response.json({ error: 'value must be a positive number' }, { status: 400 });
  }
  if (body.max_uses != null && (typeof body.max_uses !== 'number' || body.max_uses <= 0)) {
    return Response.json({ error: 'max_uses must be a positive number, or null for unlimited' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('discount_codes')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) return Response.json({ error: 'Failed to update discount code' }, { status: 500 });
  return Response.json(data);
}
