'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/store/cart';

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

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, removeItem, updateQty } = useCart();
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [discountCode, setDiscountCode] = useState('');
  const [discount, setDiscount] = useState<AppliedDiscount | null>(null);
  const [discountError, setDiscountError] = useState('');
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = discount?.total ?? subtotal;

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

  // Cart contents changed — any previously applied discount was computed against
  // the old subtotal, so drop it and make the customer re-apply the code.
  function handleRemove(id: string) {
    removeItem(id);
    setDiscount(null);
  }

  function handleQtyChange(id: string, qty: number) {
    if (qty < 1) { handleRemove(id); return; }
    updateQty(id, qty);
    setDiscount(null);
  }

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
    if (!items.length) { setError('Your cart is empty.'); return; }

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
      const orderData = await orderRes.json();
      if (!orderRes.ok) { setError(orderData.error ?? 'Could not create order.'); setPaying(false); return; }

      const { orderId } = orderData as { orderId: string; total: number };

      // Step 2 — create Razorpay order via server (amount sourced from DB order total)
      const initRes = await fetch('/api/payments/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
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
        theme: { color: '#2A7F7F' },
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

  if (!items.length && !paying) {
    return (
      <main className="max-w-7xl mx-auto px-8 md:px-12 py-20 text-center">
        <p className="text-on-surface-variant text-lg mb-6">Your cart is empty.</p>
        <a href="/" className="btn-primary inline-block px-8 py-3 rounded-xl font-bold text-sm">
          Shop All Oils
        </a>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-8 md:px-12 py-12">
      <h1 className="font-headline text-4xl font-extrabold tracking-tight text-primary mb-10">
        Secure Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* ── Shipping form ────────────────────────────────────────────── */}
        <section className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
              1
            </span>
            <h2 className="font-headline font-bold text-xl text-on-surface">Shipping Information</h2>
          </div>

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
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-bold text-sm opacity-50 shrink-0">
                2
              </span>
              <div>
                <h2 className="font-headline font-bold text-xl text-on-surface opacity-50">Payment</h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Processed securely via Razorpay — UPI, cards, net banking accepted.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Order summary ─────────────────────────────────────────────── */}
        <aside className="lg:col-span-5 sticky top-24">
          <div className="bg-surface-container-lowest rounded-3xl p-8 border border-surface-container shadow-sm">
            <h3 className="font-headline text-2xl font-bold text-primary mb-7">Order Summary</h3>

            {/* Items */}
            <div className="space-y-4 mb-7 max-h-72 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-start gap-3 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-on-surface truncate">{item.name}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <button
                        type="button"
                        onClick={() => handleQtyChange(item.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="w-6 h-6 flex items-center justify-center rounded-md bg-surface-container-high text-on-surface-variant text-sm leading-none hover:bg-surface-container-highest"
                      >
                        −
                      </button>
                      <span className="text-xs font-semibold text-on-surface-variant w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQtyChange(item.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                        className="w-6 h-6 flex items-center justify-center rounded-md bg-surface-container-high text-on-surface-variant text-sm leading-none hover:bg-surface-container-highest"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="ml-2 w-6 h-6 flex items-center justify-center rounded-md text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 7h16M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m3 0-1 13a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7h14zM10 11v6M14 11v6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <span className="font-bold text-on-surface shrink-0">
                    {fmt(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

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
                  className="flex-1 bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-on-surface-variant/40"
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
                  Place Order
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
