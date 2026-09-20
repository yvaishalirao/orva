'use client';

import { useEffect, useRef, useState } from 'react';

interface Slide { image: string; caption: string; }

const INTERVAL_MS = 6000;

export default function HeroCarousel({ slides }: { slides: Slide[] }) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const active = index % count;

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Restarts after every change (auto or manual) so a swipe/tap is never undone a moment later
    const timer = setTimeout(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [count, paused, index]);

  const go = (i: number) => setIndex(((i % count) + count) % count);

  // Swipe left/right on touch screens
  const touchStartX = useRef<number | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || count < 2) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
  }

  return (
    <section
      className="relative overflow-hidden bg-deep text-white h-[70vh] min-h-[520px] max-h-[760px]"
      aria-roledescription="carousel"
      aria-label="Featured"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <h1 className="sr-only">Orva Oils — cold-pressed oils</h1>

      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === active ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          aria-hidden={i !== active}
        >
          <img src={slide.image} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-deep/85 via-deep/45 to-transparent" />
        </div>
      ))}

      <div className="relative z-10 h-full max-w-7xl mx-auto px-8 md:px-12 flex flex-col justify-center">
        {/* key restarts the entrance animation on every slide change */}
        <div key={active} className="animate-fade-up max-w-2xl" aria-live="polite">
          {slides[active].caption && (
            <p className="font-headline text-5xl md:text-7xl font-light tracking-tight leading-[1.05] mb-8">
              {slides[active].caption}
            </p>
          )}
          <a
            href="#products"
            className="btn-accent inline-flex items-center gap-3 font-semibold px-8 py-4 rounded-sm text-xs uppercase tracking-[0.14em]"
          >
            Shop All Oils
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </a>
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(active - 1)}
            aria-label="Previous slide"
            className="hidden sm:flex absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-deep/40 hover:bg-deep/70 border border-white/20 items-center justify-center transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M10 3L5 8l5 5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => go(active + 1)}
            aria-label="Next slide"
            className="hidden sm:flex absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-deep/40 hover:bg-deep/70 border border-white/20 items-center justify-center transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M6 3l5 5-5 5" />
            </svg>
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === active}
                className="group px-1.5 py-4 flex items-center"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all duration-300 ${
                    i === active ? 'w-6 bg-accent' : 'w-1.5 bg-white/40 group-hover:bg-white/70'
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
