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
        {/* Phones: brand + sign-out on the first row, links on their own scrollable row */}
        <nav className="max-w-6xl mx-auto px-4 sm:px-8 md:px-12 py-2 md:py-0 md:h-16 flex flex-wrap md:flex-nowrap items-center gap-x-8">
          <span className="font-headline font-bold text-primary whitespace-nowrap py-2">Orva Oils Admin</span>
          <div className="order-3 md:order-none w-full md:w-auto flex gap-6 overflow-x-auto whitespace-nowrap">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors py-2.5 md:py-0"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-4 whitespace-nowrap">
            <span className="text-xs text-on-surface-variant hidden sm:inline">{admin.email}</span>
            <SignOutButton className="text-sm font-semibold text-error hover:underline py-2" />
          </div>
        </nav>
      </header>
      {children}
    </div>
  );
}
