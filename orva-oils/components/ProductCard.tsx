'use client';

import Link from 'next/link';
import { useCart } from '@/lib/store/cart';

interface Props {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
}

export default function ProductCard({ id, name, price, description, image_url }: Props) {
  const addItem = useCart((s) => s.addItem);

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <Link href={`/products/${id}`} className="block">
        {image_url ? (
          <img src={image_url} alt={name} className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 bg-amber-50 flex items-center justify-center text-4xl">
            🫙
          </div>
        )}
      </Link>
      <div className="flex flex-col gap-2 p-4 flex-1">
        <Link href={`/products/${id}`}>
          <h2 className="font-semibold text-gray-900 hover:text-amber-700 transition-colors">
            {name}
          </h2>
        </Link>
        {description && (
          <p className="text-sm text-gray-500 line-clamp-2">{description}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-bold text-gray-900">{formatted}</span>
          <button
            onClick={() => addItem({ id, name, price })}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 active:scale-95 transition-all"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
