import Link from 'next/link';
import { getAdminUser } from '@/lib/auth/adminGuard';
import SignOutButton from '@/components/SignOutButton';

const NAV = [
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/discounts', label: 'Discounts' },
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/settings', label: 'Settings' },
];

// Nav visibility only — each dashboard page still runs its own getAdminUser()
// check before touching data. This layout is not the security boundary.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser();

  if (!admin) return <>{children}</>;

  return (
    <div className="min-h-screen">
      <header className="border-b border-surface-container bg-surface-container-lowest">
        <nav className="max-w-6xl mx-auto px-8 md:px-12 h-16 flex items-center gap-8">
          <span className="font-headline font-bold text-primary">Orva Oils Admin</span>
          <div className="flex gap-6">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-xs text-on-surface-variant hidden sm:inline">{admin.email}</span>
            <SignOutButton className="text-sm font-semibold text-error hover:underline" />
          </div>
        </nav>
      </header>
      {children}
    </div>
  );
}
