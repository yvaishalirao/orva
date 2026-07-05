import NavBar from '@/components/NavBar';
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
    <>
      <NavBar />
      <main className="pt-[72px]">
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
            {/* Filter tabs — visual only */}
            <div className="flex gap-1 bg-surface-container-highest p-1 rounded-xl">
              {['All Oils', 'Carrier', 'Essential'].map((tab, i) => (
                <span
                  key={tab}
                  className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-default select-none ${
                    i === 0
                      ? 'bg-on-surface text-surface'
                      : 'text-on-surface-variant hover:text-on-surface transition-colors'
                  }`}
                >
                  {tab}
                </span>
              ))}
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

        {/* Philosophy strip */}
        <section className="bg-primary text-white py-20 px-8 md:px-12">
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M12 2C6.5 8 4 12 4 16a8 8 0 0016 0c0-4-2.5-8-8-14z" />
                    <path d="M12 12v6M12 12C10 10 8 9 6 9" />
                  </svg>
                ),
                title: '100% Biodegradable',
                body: 'Our packaging returns to the earth as gracefully as our oils.',
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                  </svg>
                ),
                title: 'Lab Verified',
                body: 'Every batch is tested for purity and zero heavy metals.',
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                ),
                title: 'Ethically Sourced',
                body: 'Direct farmer partnerships across India and North Africa.',
              },
            ].map(({ icon, title, body }) => (
              <div key={title} className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  {icon}
                </div>
                <div>
                  <h3 className="font-headline font-bold text-lg mb-1">{title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed font-light">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
