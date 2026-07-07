'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/store/cart';

const GST_RATE = 0.05;

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
  const { items, clearCart } = useCart();
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [scriptReady, setScriptReady] = useState(false);

  // Load Razorpay checkout.js once
  useEffect(() => {
    if (document.getElementById('razorpay-script')) { setScriptReady(true); return; }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => setScriptReady(true);
    script.onerror = () => setError('Failed to load payment script. Check your internet connection.');
    document.body.appendChild(script);
  }, []);

  // Cart totals
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const gst = Math.round(subtotal * GST_RATE * 100) / 100;
  const total = subtotal + gst;

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

  function set(field: keyof Address) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setAddress((a) => ({ ...a, [field]: e.target.value }));
  }

  async function handlePay() {
    setError('');
    if (!scriptReady) { setError('Payment script not ready yet.'); return; }
    if (!items.length) { setError('Your cart is empty.'); return; }

    const missing = (['name', 'phone', 'line1', 'city', 'state', 'pincode'] as const).find(
      (f) => !address[f].trim()
    );
    if (missing) { setError('Please fill in all required address fields.'); return; }

    setPaying(true);
    try {
      // Step 1 — create order on server (prices from DB, never from client)
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(({ id, quantity }) => ({ product_id: id, quantity })),
          address,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) { setError(orderData.error ?? 'Could not create order.'); setPaying(false); return; }

      const { razorpay_order_id, amount, currency, db_order_id } = orderData;

      // Step 2 — open Razorpay modal
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount,
        currency,
        order_id: razorpay_order_id,
        name: 'Orva Oils',
        description: 'Cold-pressed oils — pure & natural',
        theme: { color: '#00366d' },
        modal: {
          ondismiss() {
            setError('Payment cancelled.');
            setPaying(false);
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          // Step 3 — verify signature on server
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, db_order_id }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) {
            setError(verifyData.error ?? 'Payment verification failed.');
            setPaying(false);
            return;
          }
          clearCart();
          router.push(`/orders/${db_order_id}`);
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
            <div className="space-y-4 mb-7 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-start gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-on-surface">{item.name}</p>
                    <p className="text-on-surface-variant text-xs">Qty {item.quantity}</p>
                  </div>
                  <span className="font-bold text-on-surface shrink-0">
                    {fmt(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-3 border-t border-surface-container pt-5 mb-7">
              <div className="flex justify-between text-sm text-on-surface-variant">
                <span>Subtotal</span>
                <span className="font-medium text-on-surface">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-on-surface-variant">
                <div>
                  <span>GST (5%)</span>
                  <p className="text-[10px]">CGST 2.5% + SGST 2.5%</p>
                </div>
                <span className="font-medium text-on-surface">{fmt(gst)}</span>
              </div>
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
              disabled={paying || !scriptReady}
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
                  Pay via Razorpay
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
