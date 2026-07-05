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
    <main>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#001a38] via-[#00244d] to-[#00366d] text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent, transparent 30px, rgba(255,255,255,0.6) 30px, rgba(255,255,255,0.6) 31px)',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-8 md:px-12 py-28 md:py-40">
          <span className="inline-block bg-secondary text-white text-[10px] font-bold uppercase tracking-[0.18em] px-4 py-1.5 rounded-sm mb-7">
            Cold Pressed · Zero Additives
          </span>
          <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.05] max-w-2xl">
            Ancient Wisdom,
            <br />
            <span className="text-secondary-container">Pure Oils</span>
          </h1>
          <p className="text-white/60 text-lg mb-10 max-w-md leading-relaxed font-light">
            Single-origin botanicals, cold-pressed at source. No additives, no shortcuts — ever.
          </p>
          <a
            href="#products"
            className="inline-flex items-center gap-2.5 bg-secondary hover:bg-[#b84700] text-white font-bold px-8 py-4 rounded-xl transition-all duration-200 hover:translate-x-0.5 text-sm tracking-wide"
          >
            Shop All Oils
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </a>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="max-w-7xl mx-auto px-8 md:px-12 py-20">
        <div className="flex flex-wrap justify-between items-end gap-6 mb-14">
          <div>
            <h2 className="font-headline text-4xl font-bold text-primary tracking-tight">
              Pure Potency
            </h2>
            <p className="text-on-surface-variant mt-1.5 text-[15px]">
              Single-origin botanicals, zero additives.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
      </section>
    </main>
  );
}
