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
    <div className="group flex flex-col">
      {/* Image area */}
      <Link href={`/products/${id}`} className="block">
        <div className="bg-surface-container-lowest rounded-2xl overflow-hidden mb-5 aspect-[4/5] relative flex items-center justify-center p-8 transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1.5 border border-surface-container">
          {image_url ? (
            <img
              src={image_url}
              alt={name}
              className="max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="text-8xl select-none">🫙</span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-col gap-2 flex-1">
        <div className="flex justify-between items-start gap-2">
          <Link href={`/products/${id}`}>
            <h3 className="font-headline text-lg font-bold text-on-surface leading-tight hover:text-primary transition-colors">
              {name}
            </h3>
          </Link>
          <span className="font-headline text-lg font-bold text-primary shrink-0">{formatted}</span>
        </div>

        {description && (
          <p className="text-sm text-on-surface-variant line-clamp-2 leading-relaxed">{description}</p>
        )}

        <div className="mt-auto pt-3">
          <button
            onClick={() => addItem({ id, name, price })}
            className="btn-primary w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/20"
          >
            Add to Cart
            <svg
              width="16"
              height="16"
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
        </div>
      </div>
    </div>
  );
}
