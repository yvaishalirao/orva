import { redirect } from 'next/navigation';
import { getAdminUser } from '@/lib/auth/adminGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import SettingRow from '@/components/admin/SettingRow';

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

  return (
    <main className="max-w-3xl mx-auto px-8 md:px-12 py-12">
      <h1 className="font-headline text-3xl font-extrabold text-primary mb-8">Settings</h1>

      <div className="space-y-4">
        {KNOWN_KEYS.map(({ key, label }) => (
          <SettingRow key={key} settingKey={key} label={label} value={byKey.get(key) ?? ''} />
        ))}
      </div>
    </main>
  );
}
