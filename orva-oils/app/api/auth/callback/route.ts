import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (!code) return NextResponse.redirect(`${origin}/auth/error`);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/auth/error`);
  }

  // Upsert customer record — keyed on google_uid (auth.uid()), NOT email
  const admin = createAdminClient();
  await admin.from('customers').upsert({
    google_uid: data.user.id,          // Supabase auth UID = Google sub
    name: data.user.user_metadata?.full_name ?? '',
    email: data.user.email ?? '',
  }, { onConflict: 'google_uid', ignoreDuplicates: false });

  return NextResponse.redirect(`${origin}${next}`);
}
