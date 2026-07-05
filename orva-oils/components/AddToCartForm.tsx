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
      {/* Quantity */}
      <div className="flex items-center gap-4">
        <label htmlFor="qty" className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          Quantity
        </label>
        <div className="flex items-center gap-0 border border-outline-variant rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors text-lg font-light"
          >
            −
          </button>
          <input
            id="qty"
            type="number"
            min={1}
            max={10}
            value={quantity}
            onChange={(e) => setQuantity(Math.min(10, Math.max(1, Number(e.target.value))))}
            className="w-12 h-10 text-center text-sm font-bold text-on-surface bg-surface-container-lowest border-x border-outline-variant focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(10, q + 1))}
            className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors text-lg font-light"
          >
            +
          </button>
        </div>
      </div>

      {/* Add to Cart button */}
      <button
        onClick={handleAdd}
        className="btn-primary w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-primary/15"
      >
        Add to Cart
        <svg
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 3h2l.5 3M7 13h8l2-7H5.5" />
          <circle cx="7" cy="17" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="15" cy="17" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </button>

      {/* Confirmation */}
      {added && (
        <div className="flex items-center gap-2 text-sm font-semibold text-[#1a6b3c]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 8l3.5 3.5 7-7" />
          </svg>
          Added to cart
        </div>
      )}
    </div>
  );
}
