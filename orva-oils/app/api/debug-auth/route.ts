import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const cookieStore = await cookies();
  const all = cookieStore.getAll();
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return Response.json({
    cookies: all.map(c => ({ name: c.name, valueLen: c.value.length, valueStart: c.value.substring(0, 40) })),
    user: user ? { id: user.id, email: user.email } : null,
    error: error?.message ?? null,
  });
}
