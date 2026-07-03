import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function requireAdmin(): Promise<
  { ok: true; email: string } | { ok: false; response: NextResponse }
> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorised' }, { status: 401 }) };
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    // ADMIN_EMAIL not configured — fail closed
    return { ok: false, response: NextResponse.json({ error: 'Server misconfigured' }, { status: 500 }) };
  }

  if (user.email !== adminEmail) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { ok: true, email: user.email };
}
