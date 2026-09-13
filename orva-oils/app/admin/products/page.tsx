import { redirect } from 'next/navigation';
import { getAdminUser } from '@/lib/auth/adminGuard';
import { createAdminClient } from '@/lib/supabase/admin';
import ProductRow from '@/components/admin/ProductRow';
import NewProductForm from '@/components/admin/NewProductForm';

export default async function AdminProductsPage() {
  const admin = await getAdminUser();
  if (!admin) redirect('/admin/login');

  const supabaseAdmin = createAdminClient();
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('id, name, price, active, image_url')
    .order('name');

  return (
    <main className="max-w-5xl mx-auto px-8 md:px-12 py-12">
      <h1 className="font-headline text-3xl font-extrabold text-primary mb-8">Products</h1>

      <NewProductForm />

      <div className="space-y-3 mt-10">
        {(products ?? []).map((p) => (
          <ProductRow key={p.id} product={p} />
        ))}
        {!products?.length && <p className="text-on-surface-variant">No products yet.</p>}
      </div>
    </main>
  );
}
