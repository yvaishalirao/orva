import { redirect } from 'next/navigation';
import { getAdminUser } from '@/lib/auth/adminGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import { readCarouselSlots, CAROUSEL_SLOTS } from '@/lib/carousel';
import SettingRow from '@/components/admin/SettingRow';
import CarouselSlotEditor from '@/components/admin/CarouselSlotEditor';

const KNOWN_KEYS = [
  { key: 'contact_whatsapp', label: 'Contact WhatsApp Number' },
  { key: 'contact_address', label: 'Business Address' },
];

export default async function AdminSettingsPage() {
  const admin = await getAdminUser();
  if (!admin) redirect('/admin/login');

  const supabaseAdmin = createAdminClient();
  const { data: settings } = await supabaseAdmin.from('site_settings').select('key, value');
  const byKey = new Map((settings ?? []).map((s) => [s.key, s.value]));
  const slots = readCarouselSlots(settings ?? []);

  return (
    <main className="max-w-3xl mx-auto px-8 md:px-12 py-12">
      <h1 className="font-headline text-3xl font-extrabold text-primary mb-8">Settings</h1>

      <div className="space-y-4">
        {KNOWN_KEYS.map(({ key, label }) => (
          <SettingRow key={key} settingKey={key} label={label} value={byKey.get(key) ?? ''} />
        ))}
      </div>

      <h2 className="font-headline text-2xl font-bold text-primary mt-14 mb-1">Homepage banners</h2>
      <p className="text-sm text-on-surface-variant mb-6">
        Add up to {CAROUSEL_SLOTS} wide images (around 1920×800, max 5MB). They replace the default
        hero as a rotating carousel; remove them all to go back to the default. Banners without an
        image are skipped.
      </p>
      <div className="space-y-4">
        {slots.map((s) => (
          <CarouselSlotEditor key={s.slot} slot={s.slot} image={s.image} caption={s.caption} />
        ))}
      </div>
    </main>
  );
}
