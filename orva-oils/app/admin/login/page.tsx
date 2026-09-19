import { redirect } from 'next/navigation';

// Single sign-in flow for everyone — /api/auth/callback routes admins to
// /admin/orders automatically based on email, no separate admin login needed.
export default function AdminLoginRedirect() {
  redirect('/auth/login?next=/admin/orders');
}
