import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// For server-component pages (not API routes) — same email check as requireAdmin(),
// but returns a plain value instead of a NextResponse so pages can redirect().
export async function getAdminUser(): Promise<{ email: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!user || !adminEmail || user.email !== adminEmail) return null;
  return { email: user.email };
}

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
