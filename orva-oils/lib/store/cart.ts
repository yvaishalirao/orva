import { create } from 'zustand';

export interface CartItem { id: string; name: string; price: number; quantity: number; }

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCart = create<CartStore>((set, get) => ({
  items: [],
  addItem: (item) => set((s) => {
    const existing = s.items.find(i => i.id === item.id);
    if (existing) return { items: s.items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) };
    return { items: [...s.items, { ...item, quantity: 1 }] };
  }),
  removeItem: (id) => set((s) => ({ items: s.items.filter(i => i.id !== id) })),
  updateQty: (id, qty) => set((s) => ({ items: s.items.map(i => i.id === id ? { ...i, quantity: qty } : i) })),
  clearCart: () => set({ items: [] }),
  total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
}));
