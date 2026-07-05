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
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-amber-700 hover:text-amber-900"
      >
        ← Back to all products
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full object-cover"
            />
          ) : (
            <div className="flex h-72 items-center justify-center bg-amber-50 text-7xl">
              🫙
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          {product.description && (
            <p className="text-gray-600">{product.description}</p>
          )}
          <p className="text-2xl font-bold text-gray-900">{formatted}</p>
          <AddToCartForm id={product.id} name={product.name} price={product.price} />
        </div>
      </div>
    </main>
  );
}
