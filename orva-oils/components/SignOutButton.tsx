'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useCart } from '@/lib/store/cart';

export default function SignOutButton({
  className,
  children = 'Sign out',
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const clearCart = useCart((s) => s.clearCart);
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    await createClient().auth.signOut();
    clearCart(); // don't let the next person on this browser inherit the cart
    router.push('/');
    router.refresh();
  }

  return (
    <button type="button" onClick={handleSignOut} disabled={busy} className={className}>
      {busy ? 'Signing out…' : children}
    </button>
  );
}
