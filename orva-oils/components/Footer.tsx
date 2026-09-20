import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function Footer() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['contact_whatsapp', 'contact_address']);

  const settings = Object.fromEntries((data ?? []).map((r) => [r.key, r.value as string]));
  const whatsapp = settings.contact_whatsapp?.trim();
  const address = settings.contact_address?.trim();
  const whatsappDigits = whatsapp?.replace(/\D/g, '');

  return (
    <footer className="bg-deep text-white/70 mt-auto">
      <div className="max-w-7xl mx-auto px-8 md:px-12 pt-16 pb-8">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1.2fr] mb-14">
          <div>
            <p className="font-headline text-3xl font-semibold tracking-wide text-white mb-4">
              Orva <span className="text-accent-light">Oils</span>
            </p>
            <p className="text-sm leading-relaxed max-w-xs text-white/50">
              Cold-pressed oils, millets and traditionals — single-origin botanicals, zero additives.
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-light mb-5">Explore</p>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/#products" className="inline-block py-1 hover:text-white transition-colors">Shop all oils</Link>
              </li>
              <li>
                <Link href="/account/orders" className="inline-block py-1 hover:text-white transition-colors">Track your order</Link>
              </li>
            </ul>
          </div>

          <div id="contact" className="scroll-mt-24">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-light mb-5">Get in touch</p>
            <ul className="space-y-3 text-sm">
              {whatsapp && (
                <li>
                  <a
                    href={`https://wa.me/${whatsappDigits}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block py-1 hover:text-white transition-colors"
                  >
                    WhatsApp · {whatsapp}
                  </a>
                </li>
              )}
              {address && <li className="text-white/50">{address}</li>}
              {!whatsapp && !address && <li className="text-white/40">Contact details coming soon.</li>}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 text-xs text-white/35">
          © {new Date().getFullYear()} Orva Oils. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
