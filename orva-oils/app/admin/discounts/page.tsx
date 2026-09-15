import { redirect } from 'next/navigation';
import { getAdminUser } from '@/lib/auth/adminGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import DiscountRow from '@/components/admin/DiscountRow';
import NewDiscountForm from '@/components/admin/NewDiscountForm';

export default async function AdminDiscountsPage() {
  const admin = await getAdminUser();
  if (!admin) redirect('/admin/login');

  const supabaseAdmin = createAdminClient();
  const { data: codes } = await supabaseAdmin
    .from('discount_codes')
    .select('id, code, type, value, expiry, max_uses, uses_count, active')
    .order('code');

  return (
    <main className="max-w-5xl mx-auto px-8 md:px-12 py-12">
      <h1 className="font-headline text-3xl font-extrabold text-primary mb-8">Discount Codes</h1>

      <NewDiscountForm />

      <div className="space-y-3 mt-10">
        {(codes ?? []).map((c) => (
          <DiscountRow key={c.id} code={c} />
        ))}
        {!codes?.length && <p className="text-on-surface-variant">No discount codes yet.</p>}
      </div>
    </main>
  );
}
