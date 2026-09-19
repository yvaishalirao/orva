'use client';

import { useEffect } from 'react';
import { useCart } from '@/lib/store/cart';

// Loads the saved cart from localStorage after mount, and keeps other open tabs in sync.
export default function CartHydrator() {
  useEffect(() => {
    Promise.resolve(useCart.persist.rehydrate()).then(() => useCart.setState({ hydrated: true }));

    function onStorage(e: StorageEvent) {
      if (e.key === 'orva-cart') useCart.persist.rehydrate();
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return null;
}
