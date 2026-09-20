'use client';

import { useEffect, useRef, useState } from 'react';
import { useCart } from '@/lib/store/cart';

// A saved cart can be days old — reconcile prices/availability/photos with the live
// catalogue once it has loaded. (The server still re-prices and re-checks everything
// when the order is created.) Returns a message when something the shopper should
// know about changed; `onChanged` lets a page react (e.g. drop an applied discount).
export function useCatalogSync(onChanged?: () => void) {
  const hydrated = useCart((s) => s.hydrated);
  const syncWithCatalog = useCart((s) => s.syncWithCatalog);
  const [notice, setNotice] = useState('');
  const onChangedRef = useRef(onChanged);
  onChangedRef.current = onChanged;

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    fetch('/api/products')
      .then((r) => (r.ok ? r.json() : null))
      .then((catalog) => {
        if (cancelled || !catalog) return;
        if (syncWithCatalog(catalog)) {
          setNotice('Some items in your bag changed price or availability, so we updated it.');
          onChangedRef.current?.();
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [hydrated, syncWithCatalog]);

  return { notice };
}
