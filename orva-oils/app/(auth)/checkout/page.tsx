'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/store/cart';
import { useCatalogSync } from '@/lib/store/useCatalogSync';
import CheckoutSteps from '@/components/CheckoutSteps';

interface Address {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
}

const EMPTY_ADDRESS: Address = {
  name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '',
};

interface AppliedDiscount {
  code: string;
  discountAmount: number;
  total: number;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (data: unknown) => void) => void;
    };
  }
}

// Step 2 of 3 (Bag → Address → Payment). Guests never see this page: the middleware
// sends them to log in first, then back here.
export default function CheckoutPage() {
  const router = useRouter();
  const { items, hydrated, clearCart } = useCart();
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [discountCode, setDiscountCode] = useState('');
  const [discount, setDiscount] = useState<AppliedDiscount | null>(null);
  const [discountError, setDiscountError] = useState('');
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  // Prices/availability changed since the bag was saved → an applied discount is stale.
  const { notice: cartNotice } = useCatalogSync(() => setDiscount(null));

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = discount?.total ?? subtotal;

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

  function set(field: keyof Address) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setAddress((a) => ({ ...a, [field]: e.target.value }));
  }

  async function handleApplyDiscount() {
    setDiscountError('');
    if (!discountCode.trim()) return;
    setApplyingDiscount(true);
    try {
      const res = await fetch('/api/discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode, subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDiscount(null);
        setDiscountError(data.error ?? 'Could not apply discount code.');
        return;
      }
      setDiscount(data);
    } catch {
      setDiscountError('Could not apply discount code.');
    } finally {
      setApplyingDiscount(false);
    }
  }

  async function handlePay() {
    setError('');
    if (typeof window === 'undefined' || !window.Razorpay) {
      setError('Payment script not ready yet.');
      return;
    }
    if (!items.length) { setError('Your bag is empty.'); return; }

    const missing = (['name', 'phone', 'line1', 'city', 'state', 'pincode'] as const).find(
      (f) => !address[f].trim()
    );
    if (missing) { setError('Please fill in all required address fields.'); return; }

    setPaying(true);
    try {
      // Step 1 — create order on server (prices from DB, never from client)
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(({ id, quantity }) => ({ productId: id, quantity })),
          address: { ...address, line2: address.line2.trim() || undefined },
          discountCode: discount?.code,
        }),
      });
      // Session expired while filling the form — log in again and come back here.
      if (orderRes.status === 401) { router.push('/auth/login?next=/checkout'); return; }
      const orderData = await orderRes.json();
      if (!orderRes.ok) { setError(orderData.error ?? 'Could not create order.'); setPaying(false); return; }

      const { orderId } = orderData as { orderId: string; total: number };

      // Step 2 — create Razorpay order via server (amount sourced from DB order total)
      const initRes = await fetch('/api/payments/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      if (initRes.status === 401) { router.push('/auth/login?next=/checkout'); return; }
      const initData = await initRes.json();
      if (!initRes.ok) { setError(initData.error ?? 'Could not start payment.'); setPaying(false); return; }

      const { razorpayOrderId, keyId } = initData as { razorpayOrderId: string; keyId: string };

      // Step 3 — open Razorpay modal
      const rzp = new window.Razorpay({
        key: keyId,
        order_id: razorpayOrderId,
        name: 'Orva Oils',
        description: 'Oil order',
        prefill: { contact: address.phone },
        theme: { color: '#3D4A26' },
        modal: {
          ondismiss() {
            setError('Payment cancelled.');
            setPaying(false);
          },
        },
        // Order is marked paid server-side by the Razorpay webhook (INV-01) —
        // this handler only redirects once the modal reports success.
        handler: () => {
          clearCart();
          router.push(`/orders/${orderId}`);
        },
      });

      rzp.on('payment.failed', (data: unknown) => {
        const msg = (data as { error?: { description?: string } })?.error?.description;
        setError(msg ?? 'Payment failed. Please try again.');
        setPaying(false);
      });

      rzp.open();
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
      setPaying(false);
    }
  }

  if (!hydrated) {
    return (
      <main className="max-w-7xl mx-auto px-8 md:px-12 py-20 text-center">
        <p className="text-on-surface-variant">Loading your bag…</p>
      </main>
    );
  }

  if (!items.length && !paying) {
    return (
      <main className="max-w-md mx-auto px-8 py-24 text-center">
        <h1 className="font-headline text-3xl font-bold text-primary mb-2">Your bag is empty</h1>
        <p className="text-on-surface-variant text-sm mb-8">Add something to your bag before checking out.</p>
        <Link href="/#products" className="btn-primary inline-block px-10 py-3.5 rounded-sm font-bold text-xs uppercase tracking-wider">
          Shop all oils
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 py-10">
      <CheckoutSteps current={2} />

      <h1 className="font-headline text-4xl font-bold tracking-tight text-primary mb-10">
        Delivery &amp; Payment
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        {/* ── Delivery address ─────────────────────────────────────────── */}
        <section className="lg:col-span-7 space-y-6">
          <h2 className="font-headline font-bold text-2xl text-on-surface">Delivery address</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(
              [
                { field: 'name', label: 'Full Name', placeholder: 'Arjun Varma', colSpan: 'md:col-span-2' },
                { field: 'phone', label: 'Phone', placeholder: '98765 43210', colSpan: '' },
                { field: 'line1', label: 'Address', placeholder: 'Flat 4B, MG Road', colSpan: 'md:col-span-2' },
                { field: 'line2', label: 'Landmark (optional)', placeholder: 'Near HDFC Bank', colSpan: 'md:col-span-2' },
                { field: 'city', label: 'City', placeholder: 'Bengaluru', colSpan: '' },
                { field: 'state', label: 'State', placeholder: 'Karnataka', colSpan: '' },
                { field: 'pincode', label: 'PIN Code', placeholder: '560001', colSpan: '' },
              ] as { field: keyof Address; label: string; placeholder: string; colSpan: string }[]
            ).map(({ field, label, placeholder, colSpan }) => (
              <div key={field} className={colSpan}>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">
                  {label}
                </label>
                <input
                  type="text"
                  value={address[field]}
                  onChange={set(field)}
                  placeholder={placeholder}
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-on-surface-variant/40"
                />
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-surface-container-high">
            <h2 className="font-headline font-bold text-2xl text-on-surface">Payment</h2>
            <p className="text-sm text-on-surface-variant mt-1">
              You&apos;ll pay securely via Razorpay after this — UPI, cards and net banking accepted.
            </p>
          </div>
        </section>

        {/* ── Order summary (read-only — edit the bag on the previous step) ── */}
        <aside className="lg:col-span-5 lg:sticky lg:top-24">
          <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-surface-container shadow-sm">
            <div className="flex items-baseline justify-between mb-6">
              <h3 className="font-headline text-2xl font-bold text-primary">Order Summary</h3>
              <Link href="/cart" className="text-xs font-bold uppercase tracking-wider text-secondary hover:underline py-2">
                Edit bag
              </Link>
            </div>

            {cartNotice && (
              <p className="text-xs mb-5 bg-accent/15 border border-accent/30 text-on-surface px-4 py-3 rounded-xl">
                {cartNotice}
              </p>
            )}

            <ul className="space-y-4 mb-7 max-h-72 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 text-sm">
                  <div className="shrink-0 w-12 h-14 rounded-lg bg-surface-container-low flex items-center justify-center overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-xl select-none">🫙</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-on-surface truncate">{item.name}</p>
                    <p className="text-on-surface-variant text-xs">Qty {item.quantity}</p>
                  </div>
                  <span className="font-bold text-on-surface shrink-0">{fmt(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>

            {/* Discount code */}
            <div className="mb-7">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">
                Discount Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => { setDiscountCode(e.target.value); setDiscount(null); }}
                  placeholder="e.g. WELCOME10"
                  className="flex-1 min-w-0 bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-on-surface-variant/40"
                />
                <button
                  type="button"
                  onClick={handleApplyDiscount}
                  disabled={applyingDiscount || !discountCode.trim()}
                  className="px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wide bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors disabled:opacity-50"
                >
                  {applyingDiscount ? '...' : 'Apply'}
                </button>
              </div>
              {discountError && <p className="text-error text-xs mt-2">{discountError}</p>}
              {discount && (
                <p className="text-xs mt-2 text-[#1a6b3c] font-semibold">
                  “{discount.code}” applied — {fmt(discount.discountAmount)} off
                </p>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-3 border-t border-surface-container pt-5 mb-7">
              <div className="flex justify-between text-sm text-on-surface-variant">
                <span>Subtotal</span>
                <span className="font-medium text-on-surface">{fmt(subtotal)}</span>
              </div>
              {discount && (
                <div className="flex justify-between text-sm text-on-surface-variant">
                  <span>Discount</span>
                  <span className="font-medium text-[#1a6b3c]">−{fmt(discount.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-end pt-3 border-t border-surface-container-highest">
                <span className="font-headline font-bold text-primary">Total Payable</span>
                <span className="font-headline text-3xl font-extrabold text-primary">{fmt(total)}</span>
              </div>
            </div>

            {error && (
              <p className="text-error text-sm mb-4 bg-error-container/30 px-4 py-3 rounded-xl">
                {error}
              </p>
            )}

            <button
              onClick={handlePay}
              disabled={paying}
              className="btn-primary w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary/15"
            >
              {paying ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Processing…
                </>
              ) : (
                <>
                  Pay {fmt(total)}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                </>
              )}
            </button>

            <p className="text-center text-[10px] text-on-surface-variant mt-4 flex items-center justify-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              PCI-DSS Compliant · 256-bit SSL
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
