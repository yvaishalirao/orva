import { createClient } from '@/lib/supabase/server';
import ProductCard from '@/components/ProductCard';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select('id, name, description, price, image_url')
    .eq('active', true)
    .order('name');

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Our Oils</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(products ?? []).map((p) => (
          <ProductCard
            key={p.id}
            id={p.id}
            name={p.name}
            price={p.price}
            description={p.description}
            image_url={p.image_url}
          />
        ))}
      </div>
    </main>
  );
}
