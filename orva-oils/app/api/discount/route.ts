import { createAdminClient } from '@/lib/supabase/admin';
import { applyDiscount, calculateDiscountAmount, type DiscountType } from '@/lib/utils/discount';

export async function POST(request: Request) {
  const { code, subtotal } = await request.json() as { code?: string; subtotal?: number };

  if (!code || typeof subtotal !== 'number' || subtotal < 0) {
    return Response.json({ error: 'code and subtotal are required' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Atomic check-and-increment — no read-then-write (INV-09)
  const { data, error } = await admin.rpc('redeem_discount_code', { p_code: code.trim().toUpperCase() });

  if (error || !data || data.length === 0) {
    return Response.json({ error: 'Discount code is invalid or unavailable' }, { status: 400 });
  }

  const { type, value } = data[0] as { id: string; type: DiscountType; value: number };

  return Response.json({
    valid: true,
    code: code.trim().toUpperCase(),
    discountAmount: calculateDiscountAmount(subtotal, type, value),
    total: applyDiscount(subtotal, type, value),
  });
}
