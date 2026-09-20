import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// ADMIN_EMAIL may hold one address or a comma-separated list. Empty/unset = nobody is admin.
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAIL ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.trim().toLowerCase());
}

// For server-component pages (not API routes) — same email check as requireAdmin(),
// but returns a plain value instead of a NextResponse so pages can redirect().
export async function getAdminUser(): Promise<{ email: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) return null;
  return { email: user.email! };
}

export async function requireAdmin(): Promise<
  { ok: true; email: string } | { ok: false; response: NextResponse }
> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorised' }, { status: 401 }) };
  }

  if (adminEmails().length === 0) {
    // ADMIN_EMAIL not configured — fail closed
    return { ok: false, response: NextResponse.json({ error: 'Server misconfigured' }, { status: 500 }) };
  }

  if (!isAdminEmail(user.email)) {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { ok: true, email: user.email! };
}
