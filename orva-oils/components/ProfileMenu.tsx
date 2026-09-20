'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import SignOutButton from '@/components/SignOutButton';

interface Profile { name: string; email: string; }

function toProfile(user: User | null | undefined): Profile | null {
  if (!user) return null;
  const email = user.email ?? '';
  const full = (user.user_metadata?.full_name as string | undefined)?.trim();
  return { name: full ? full.split(' ')[0] : email.split('@')[0], email };
}

const linkClass = 'block px-6 py-2.5 text-sm text-on-surface-variant hover:text-primary hover:font-semibold transition-colors';

export default function ProfileMenu() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setProfile(toProfile(data.user)));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setProfile(toProfile(session?.user));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Hover opens the menu for mouse users (short leave delay so crossing the gap doesn't flicker);
  // touch and keyboard users toggle it with a tap/Enter.
  function onPointerEnter(e: React.PointerEvent) {
    if (e.pointerType !== 'mouse') return;
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setOpen(true);
  }
  function onPointerLeave(e: React.PointerEvent) {
    if (e.pointerType !== 'mouse') return;
    leaveTimer.current = setTimeout(() => setOpen(false), 150);
  }
  function onIconClick(e: React.MouseEvent) {
    const type = (e.nativeEvent as PointerEvent).pointerType;
    setOpen((o) => (type === 'mouse' ? true : !o));
  }

  const next = pathname && !pathname.startsWith('/auth') ? pathname : '/';
  const close = () => setOpen(false);

  return (
    <div
      ref={wrapperRef}
      className="relative h-[72px] flex items-center"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <button
        type="button"
        onClick={onIconClick}
        aria-label="Profile"
        aria-haspopup="menu"
        aria-expanded={open}
        className="p-2.5 -m-2.5 text-primary-container hover:text-primary transition-colors"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>

      {open && (
        <>
          <span className="absolute bottom-0 -left-2 -right-2 h-[3px] bg-secondary" aria-hidden="true" />
          <div
            role="menu"
            className="absolute right-0 top-full w-72 bg-surface-container-lowest border border-surface-container shadow-xl pt-6 pb-3"
          >
            <div className="px-6 pb-5 border-b border-surface-container">
              {profile ? (
                <>
                  <p className="font-bold text-on-surface">Hello {profile.name}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5 truncate">{profile.email}</p>
                </>
              ) : (
                <>
                  <p className="font-bold text-on-surface">Welcome</p>
                  <p className="text-sm text-on-surface-variant mt-0.5 mb-4">To access account and manage orders</p>
                  <Link
                    href={`/auth/login?next=${encodeURIComponent(next)}`}
                    onClick={close}
                    className="inline-block border border-outline-variant hover:border-secondary text-secondary font-bold text-xs uppercase tracking-wider px-8 py-3 transition-colors"
                  >
                    Login / Signup
                  </Link>
                </>
              )}
            </div>

            <nav className="pt-3">
              <Link href="/account/orders" onClick={close} className={linkClass}>Orders</Link>
              <a href="#contact" onClick={close} className={linkClass}>Contact Us</a>
            </nav>

            {profile && (
              <div className="border-t border-surface-container mt-2 pt-2">
                <SignOutButton className={`${linkClass} w-full text-left`}>Logout</SignOutButton>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
