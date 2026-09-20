import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
  stock?: number;
}

export interface CatalogEntry {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url?: string | null;
}

interface CartStore {
  items: CartItem[];
  // False until the persisted cart has been loaded from localStorage (see CartHydrator).
  hydrated: boolean;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  total: () => number;
  // Reconcile a persisted cart with the live catalogue; returns true if the shopper
  // needs to be told something changed (removed item, new price/name, lower quantity).
  syncWithCatalog: (catalog: CatalogEntry[]) => boolean;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      hydrated: false,
      addItem: (item) => set((s) => {
        const existing = s.items.find(i => i.id === item.id);
        if (existing) return { items: s.items.map(i => i.id === item.id ? { ...i, ...item, quantity: i.quantity + 1 } : i) };
        return { items: [...s.items, { ...item, quantity: 1 }] };
      }),
      removeItem: (id) => set((s) => ({ items: s.items.filter(i => i.id !== id) })),
      updateQty: (id, qty) => set((s) => ({ items: s.items.map(i => i.id === id ? { ...i, quantity: qty } : i) })),
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      syncWithCatalog: (catalog) => {
        let notify = false;
        let dirty = false;
        const next: CartItem[] = [];
        for (const item of get().items) {
          const product = catalog.find(c => c.id === item.id);
          if (!product || product.stock <= 0) { notify = true; dirty = true; continue; }
          const quantity = Math.min(item.quantity, product.stock);
          if (quantity !== item.quantity || product.price !== item.price || product.name !== item.name) notify = true;
          const updated: CartItem = {
            id: item.id, name: product.name, price: product.price, quantity,
            image_url: product.image_url ?? null, stock: product.stock,
          };
          if (JSON.stringify(updated) !== JSON.stringify(item)) dirty = true;
          next.push(updated);
        }
        if (dirty) set({ items: next });
        return notify;
      },
    }),
    {
      name: 'orva-cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Loaded manually after mount so server and first client render both start empty —
      // rehydrating during render would cause a hydration mismatch.
      skipHydration: true,
      partialize: (state) => ({ items: state.items }),
    }
  )
);
