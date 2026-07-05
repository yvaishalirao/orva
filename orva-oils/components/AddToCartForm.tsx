'use client';

import { useState } from 'react';
import { useCart } from '@/lib/store/cart';

interface Props {
  id: string;
  name: string;
  price: number;
}

export default function AddToCartForm({ id, name, price }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCart((s) => s.addItem);

  function handleAdd() {
    for (let i = 0; i < quantity; i++) {
      addItem({ id, name, price });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <label htmlFor="qty" className="text-sm font-medium text-gray-700">
          Quantity
        </label>
        <input
          id="qty"
          type="number"
          min={1}
          max={10}
          value={quantity}
          onChange={(e) => {
            const v = Math.min(10, Math.max(1, Number(e.target.value)));
            setQuantity(v);
          }}
          className="w-16 rounded-lg border border-gray-300 px-3 py-1.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <button
        onClick={handleAdd}
        className="rounded-lg bg-amber-600 px-6 py-2.5 font-medium text-white hover:bg-amber-700 active:scale-95 transition-all"
      >
        Add to Cart
      </button>

      {added && (
        <p className="text-sm font-medium text-green-700">✓ Added to cart</p>
      )}
    </div>
  );
}
