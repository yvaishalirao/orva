import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => { response.cookies.set({ name, value, ...options }); },
        remove: (name, options) => { response.cookies.set({ name, value: '', ...options }); },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // Single sign-in flow for everyone — /api/auth/callback routes admins to
  // /admin/orders automatically based on email. requireAdmin()/getAdminUser()
  // remain the real security boundary; this is just where to send someone to sign in.
  const needsAuth =
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/account') ||
    (pathname.startsWith('/admin') && pathname !== '/admin/login');

  if (!user && needsAuth) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/checkout', '/account/:path*', '/admin/:path*'],
};
