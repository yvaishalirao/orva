import { createClient } from '@/lib/supabase/server';
import ProductCard from '@/components/ProductCard';
import HeroCarousel from '@/components/HeroCarousel';
import { activeSlides } from '@/lib/carousel';

const TICKER = [
  'Cold Pressed · Zero Additives',
  '100% Biodegradable Packaging',
  'Lab Verified Every Batch',
  'Single-Origin Botanicals',
  'Free Delivery Above ₹999',
];

const PILLARS = [
  {
    title: '100% Biodegradable',
    body: 'Our packaging returns to the earth as gracefully as our oils.',
    tint: 'bg-primary-container/50 text-accent-light',
    icon: (
      <>
        <path d="M12 2C6.5 8 4 12 4 16a8 8 0 0016 0c0-4-2.5-8-8-14z" />
        <path d="M12 12v6M12 12C10 10 8 9 6 9" />
      </>
    ),
  },
  {
    title: 'Lab Verified',
    body: 'Every batch is tested for purity and zero heavy metals.',
    tint: 'bg-accent/25 text-accent-light',
    icon: <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />,
  },
  {
    title: 'Ethically Sourced',
    body: 'Direct from  India.',
    tint: 'bg-secondary/30 text-accent-light',
    icon: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
  },
];

function SectionLabel({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p
      className={`flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] mb-3 ${
        light ? 'text-accent-light' : 'text-primary-container'
      }`}
    >
      <span className={`block w-6 h-px ${light ? 'bg-accent-light' : 'bg-primary-container'}`} />
      {children}
    </p>
  );
}

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: products }, { data: settingRows }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, description, price, image_url, stock')
      .eq('active', true)
      .order('name'),
    supabase.from('site_settings').select('key, value').like('key', 'carousel_%'),
  ]);

  // Admin-managed banners replace the default hero; none configured = default hero.
  const slides = activeSlides(settingRows ?? []);

  return (
    <main>
      {/* Hero */}
      {slides.length > 0 ? (
        <HeroCarousel slides={slides} />
      ) : (
      <section className="relative bg-gradient-to-br from-deep via-deep-2 to-primary text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent, transparent 30px, var(--color-accent) 30px, var(--color-accent) 31px)',
          }}
        />
        <div className="absolute -right-32 top-1/2 -translate-y-1/2 w-[36rem] h-[36rem] rounded-full bg-accent opacity-20 blur-3xl" />

        <svg
          className="hidden lg:block absolute right-[9%] top-1/2 -translate-y-1/2 w-60 text-accent opacity-90"
          viewBox="0 0 220 480"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M75 160 C40 185 25 240 25 300 C25 380 50 440 110 445 C170 440 195 380 195 300 C195 240 180 185 145 160 L145 80 C145 65 135 55 120 50 L100 50 C85 55 75 65 75 80 Z"
            fill="currentColor"
            fillOpacity="0.1"
            stroke="currentColor"
            strokeOpacity="0.55"
            strokeWidth="1.5"
          />
          <rect x="88" y="20" width="44" height="35" rx="6" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeOpacity="0.5" />
          <rect x="42" y="220" width="136" height="140" rx="4" fill="currentColor" fillOpacity="0.07" stroke="currentColor" strokeOpacity="0.3" strokeWidth="0.8" />
          <line x1="70" y1="255" x2="150" y2="255" stroke="currentColor" strokeOpacity="0.4" strokeWidth="0.8" />
          <line x1="80" y1="275" x2="140" y2="275" stroke="currentColor" strokeOpacity="0.25" strokeWidth="0.8" />
          <line x1="60" y1="295" x2="160" y2="295" stroke="currentColor" strokeOpacity="0.25" strokeWidth="0.8" />
          <circle cx="110" cy="340" r="22" stroke="currentColor" strokeOpacity="0.3" strokeWidth="0.8" />
          <circle cx="110" cy="340" r="14" stroke="currentColor" strokeOpacity="0.25" strokeWidth="0.8" />
          <circle cx="110" cy="340" r="5" fill="currentColor" fillOpacity="0.3" />
        </svg>

        <div className="relative max-w-7xl mx-auto px-8 md:px-12 py-28 md:py-40">
          <span className="animate-fade-up [animation-delay:100ms] inline-block text-accent-light bg-accent/15 border border-accent/30 text-[10px] font-semibold uppercase tracking-[0.18em] px-4 py-1.5 rounded-sm mb-7">
            ✦ Cold Pressed · Zero Additives
          </span>
          <h1 className="animate-fade-up [animation-delay:250ms] font-headline text-6xl md:text-8xl font-light tracking-tight mb-6 leading-[1.02] max-w-2xl">
            Ancient Wisdom,
            <br />
            <em className="italic font-normal text-accent-light">Pure Oils</em>
          </h1>
          <p className="animate-fade-up [animation-delay:400ms] text-white/65 text-lg mb-10 max-w-md leading-relaxed">
            Single-origin botanicals, cold-pressed at source. No additives, no shortcuts — ever.
          </p>
          <a
            href="#products"
            className="animate-fade-up [animation-delay:550ms] btn-accent inline-flex items-center gap-3 font-semibold px-8 py-4 rounded-sm text-xs uppercase tracking-[0.14em]"
          >
            Shop All Oils
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </a>
        </div>
      </section>
      )}

      {/* Ticker */}
      <div className="bg-band text-white overflow-hidden whitespace-nowrap py-2.5" aria-hidden="true">
        <div className="animate-ticker inline-flex">
          {[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((text, i) => (
            <span key={i} className="flex items-center gap-4 px-10 text-[11px] font-medium uppercase tracking-[0.14em]">
              <span className="w-1 h-1 rounded-full bg-accent shrink-0" />
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* Products */}
      <section id="products" className="max-w-7xl mx-auto px-8 md:px-12 py-24 scroll-mt-20">
        <div className="mb-14">
          <SectionLabel>Our Collection</SectionLabel>
          <h2 className="font-headline text-5xl md:text-6xl font-medium text-on-surface tracking-tight">
            Pure <em className="italic text-primary-container">Potency</em>
          </h2>
          <p className="text-on-surface-variant mt-3 text-[15px]">
            Single-origin botanicals, zero additives.
          </p>
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
              stock={p.stock}
            />
          ))}
        </div>
      </section>

      {/* Philosophy */}
      <section className="bg-deep text-white">
        <div className="max-w-7xl mx-auto px-8 md:px-12 py-24 grid gap-14 md:grid-cols-2 items-center">
          <div>
            <SectionLabel light>Our Philosophy</SectionLabel>
            <h2 className="font-headline text-5xl md:text-6xl font-light tracking-tight leading-[1.05] mb-6">
              The standard
              <br />
              <em className="italic text-accent-light">of purity</em>
            </h2>
            <p className="text-white/60 leading-relaxed max-w-md">
              Every oil is cold-pressed at source from single-origin botanicals — no additives,
              no shortcuts, ever.
            </p>
          </div>

          <div className="space-y-4">
            {PILLARS.map(({ title, body, tint, icon }) => (
              <div
                key={title}
                className="flex items-center gap-5 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors rounded-xl p-6"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${tint}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    {icon}
                  </svg>
                </div>
                <div>
                  <h3 className="font-headline text-xl font-semibold text-white mb-0.5">{title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
