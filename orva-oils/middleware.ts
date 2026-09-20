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

  // Shoppers browse freely: the bag, checkout page and orders page all load without a
  // login. Login is asked for only when they click Login/Signup or place an order (the
  // checkout page and the order APIs enforce that). Admin pages are the exception.
  // /api/auth/callback routes admins to /admin/orders based on email; requireAdmin()/
  // getAdminUser() remain the real security boundary.
  const needsAuth = pathname.startsWith('/admin') && pathname !== '/admin/login';

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
