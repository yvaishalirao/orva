'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/store/cart';
import { createClient } from '@/lib/supabase/client';
import SignOutButton from '@/components/SignOutButton';

const NAV_LINKS = ['Shop All', 'Wellness Rituals', 'The Alchemist', 'Pure Organic'];

function AccountIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default function NavBar() {
  const items = useCart((s) => s.items);
  const count = items.reduce((n, i) => n + i.quantity, 0);

  const [email, setEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-surface-container">
      <nav className="flex justify-between items-center w-full px-8 md:px-12 h-[72px] max-w-screen-2xl mx-auto">
        {/* Logo + links */}
        <div className="flex items-center gap-10">
          <Link
            href="/"
            className="text-3xl font-headline font-semibold tracking-wide text-on-surface"
          >
            Orva <span className="text-primary-container">Oils</span>
          </Link>
          <ul className="hidden md:flex gap-7 list-none m-0 p-0">
            {NAV_LINKS.map((link) => (
              <li key={link}>
                <Link
                  href="/"
                  className="font-headline font-semibold uppercase text-[11px] tracking-widest text-on-surface opacity-60 hover:text-primary hover:opacity-100 transition-all duration-200"
                >
                  {link}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-5">
          {/* Cart */}
          <Link
            href="/checkout"
            className="relative text-primary-container hover:text-primary transition-colors"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-secondary text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full leading-none">
                {count}
              </span>
            )}
          </Link>

          {/* Account */}
          <div ref={menuRef} className="relative">
            {email ? (
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Account menu"
                className="text-primary-container hover:text-primary transition-colors"
              >
                <AccountIcon />
              </button>
            ) : (
              <Link
                href="/auth/login"
                aria-label="Sign in"
                className="text-primary-container hover:text-primary transition-colors"
              >
                <AccountIcon />
              </Link>
            )}

            {email && menuOpen && (
              <div className="absolute right-0 mt-3 w-60 bg-surface-container-lowest border border-surface-container rounded-2xl shadow-lg overflow-hidden">
                <p className="px-4 py-3 text-xs text-on-surface-variant truncate border-b border-surface-container">
                  {email}
                </p>
                <Link
                  href="/account/orders"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  My orders
                </Link>
                <SignOutButton className="block w-full text-left px-4 py-3 text-sm font-semibold text-error hover:bg-error-container/30 transition-colors" />
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
