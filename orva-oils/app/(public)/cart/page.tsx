'use client';

import Link from 'next/link';
import { useCart } from '@/lib/store/cart';
import { useCatalogSync } from '@/lib/store/useCatalogSync';
import CheckoutSteps from '@/components/CheckoutSteps';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

export default function BagPage() {
  const { items, hydrated, removeItem, updateQty } = useCart();
  const { notice } = useCatalogSync();

  const count = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  if (!hydrated) {
    return (
      <main className="max-w-7xl mx-auto px-8 md:px-12 py-20 text-center">
        <p className="text-on-surface-variant">Loading your bag…</p>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="max-w-md mx-auto px-8 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-primary-container/10 text-primary-container flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
        </div>
        <h1 className="font-headline text-3xl font-bold text-primary mb-2">Your bag is empty</h1>
        <p className="text-on-surface-variant text-sm mb-8">Add something from the collection and it will show up here.</p>
        <Link href="/#products" className="btn-primary inline-block px-10 py-3.5 rounded-sm font-bold text-xs uppercase tracking-wider">
          Shop all oils
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 py-10 pb-32 lg:pb-16">
      <CheckoutSteps current={1} />

      <h1 className="font-headline text-4xl font-bold tracking-tight text-primary mb-1">Your Bag</h1>
      <p className="text-sm text-on-surface-variant mb-8">
        {count} {count === 1 ? 'item' : 'items'}
      </p>

      {notice && (
        <p className="text-xs mb-6 bg-accent/15 border border-accent/30 text-on-surface px-4 py-3 rounded-xl">{notice}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <section className="lg:col-span-8 space-y-4" aria-label="Items in your bag">
          {items.map((item) => {
            const maxQty = item.stock ?? 99;
            return (
              <article key={item.id} className="flex gap-4 bg-surface-container-lowest border border-surface-container rounded-2xl p-4">
                <Link href={`/products/${item.id}`} className="shrink-0 w-24 h-28 rounded-xl bg-surface-container-low flex items-center justify-center overflow-hidden">
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="w-full h-full object-contain p-2" />
                  ) : (
                    <span className="text-4xl select-none">🫙</span>
                  )}
                </Link>

                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex justify-between items-start gap-3">
                    <Link href={`/products/${item.id}`} className="font-headline text-xl font-semibold text-on-surface leading-tight hover:text-primary-container transition-colors">
                      {item.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${item.name}`}
                      className="shrink-0 -mr-2 -mt-2 w-10 h-10 flex items-center justify-center rounded-md text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 7h16M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m3 0-1 13a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7h14zM10 11v6M14 11v6" />
                      </svg>
                    </button>
                  </div>

                  <p className="text-sm text-on-surface-variant mt-1">{fmt(item.price)} each</p>

                  <div className="mt-auto pt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center border border-outline-variant rounded-lg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => (item.quantity <= 1 ? removeItem(item.id) : updateQty(item.id, item.quantity - 1))}
                        aria-label="Decrease quantity"
                        className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors text-lg"
                      >
                        −
                      </button>
                      <span className="w-10 text-center text-sm font-bold text-on-surface" aria-live="polite">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        disabled={item.quantity >= maxQty}
                        aria-label="Increase quantity"
                        className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors text-lg disabled:opacity-40 disabled:hover:bg-transparent"
                      >
                        +
                      </button>
                    </div>
                    <p className="font-headline text-2xl font-bold text-primary-container">{fmt(item.price * item.quantity)}</p>
                  </div>
                  {item.stock !== undefined && item.quantity >= item.stock && (
                    <p className="text-[11px] text-secondary font-semibold mt-1.5">Maximum available quantity</p>
                  )}
                </div>
              </article>
            );
          })}

          <Link href="/#products" className="inline-flex items-center gap-2 py-2 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M13 8H3M7 4l-4 4 4 4" />
            </svg>
            Continue shopping
          </Link>
        </section>

        <aside className="lg:col-span-4 lg:sticky lg:top-24">
          <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant mb-5">Price details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-on-surface-variant">
                <span>Subtotal ({count} {count === 1 ? 'item' : 'items'})</span>
                <span className="font-medium text-on-surface">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between items-end pt-4 border-t border-surface-container-high">
                <span className="font-headline text-lg font-bold text-primary">Total</span>
                <span className="font-headline text-3xl font-bold text-primary">{fmt(subtotal)}</span>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant mt-4">Have a discount code? You can apply it at the next step.</p>
            <Link
              href="/checkout"
              className="hidden lg:block btn-primary text-center w-full mt-6 py-4 rounded-sm font-bold text-sm uppercase tracking-wider"
            >
              Place Order
            </Link>
          </div>
        </aside>
      </div>

      {/* Phones: keep the total and Place Order in reach while scrolling the bag */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-container-lowest border-t border-surface-container px-4 py-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] text-on-surface-variant leading-none mb-1">Total</p>
          <p className="font-headline text-2xl font-bold text-primary leading-none">{fmt(subtotal)}</p>
        </div>
        <Link
          href="/checkout"
          className="btn-primary flex-1 max-w-[220px] text-center py-3.5 rounded-sm font-bold text-xs uppercase tracking-wider"
        >
          Place Order
        </Link>
      </div>
    </main>
  );
}
