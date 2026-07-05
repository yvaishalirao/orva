import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import AddToCartForm from '@/components/AddToCartForm';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from('products')
    .select('id, name, description, price, image_url')
    .eq('id', id)
    .eq('active', true)
    .single();

  if (!product) notFound();

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(product.price);

  return (
    <main className="max-w-7xl mx-auto px-8 md:px-12 py-12">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors mb-10"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M13 8H3M7 4l-4 4 4 4" />
        </svg>
        Back to all products
      </Link>

      <div className="grid gap-12 md:grid-cols-2 items-start">
        {/* Image */}
        <div className="bg-surface-container-lowest rounded-3xl border border-surface-container p-10 flex items-center justify-center aspect-square">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="max-h-full object-contain"
            />
          ) : (
            <span className="text-9xl select-none">🫙</span>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight mb-3">
              {product.name}
            </h1>
            {product.description && (
              <p className="text-on-surface-variant text-[15px] leading-relaxed">{product.description}</p>
            )}
          </div>

          <div className="flex items-baseline gap-1">
            <span className="font-headline text-4xl font-extrabold text-primary tracking-tight">
              {formatted}
            </span>
            <span className="text-sm text-on-surface-variant ml-1">incl. taxes</span>
          </div>

          <div className="h-px bg-surface-container-high" />

          <AddToCartForm id={product.id} name={product.name} price={product.price} />

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            {[
              { label: 'Cold Pressed', sub: 'No heat, no additives' },
              { label: 'Lab Verified', sub: 'Every batch tested' },
              { label: 'Ethically Sourced', sub: 'Direct farm partnerships' },
              { label: 'Free Delivery', sub: 'On orders above ₹999' },
            ].map(({ label, sub }) => (
              <div
                key={label}
                className="bg-surface-container-low rounded-xl p-3.5 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-primary-container/10 flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a4d8c" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 12l2 2 4-4" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface">{label}</p>
                  <p className="text-[11px] text-on-surface-variant">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
