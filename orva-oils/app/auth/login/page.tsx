'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGoogleLogin() {
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface-container-low flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm bg-surface-container-lowest shadow-xl overflow-hidden">
        <div className="relative h-44 bg-gradient-to-br from-deep via-deep-2 to-primary text-white flex flex-col items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, transparent, transparent 24px, var(--color-accent) 24px, var(--color-accent) 25px)',
            }}
          />
          <p className="relative font-headline text-4xl font-semibold tracking-wide">
            Orva <span className="text-accent-light">Oils</span>
          </p>
          <p className="relative mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-light">
            Cold pressed · Zero additives
          </p>
        </div>

        <div className="p-8">
          <h1 className="text-lg font-bold text-on-surface mb-1">Login or Signup</h1>
          <p className="text-sm text-on-surface-variant mb-6">
            Continue with your Google account. New here? We&apos;ll create your account automatically.
          </p>

          {error && (
            <p className="text-error text-sm mb-4 bg-error-container/30 px-4 py-3 rounded-sm">{error}</p>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="btn-primary w-full py-3.5 rounded-sm font-bold text-sm uppercase tracking-wider disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          <p className="text-xs text-on-surface-variant mt-6">
            Have trouble logging in?{' '}
            <Link href="/#contact" className="font-bold text-secondary hover:underline">
              Contact us
            </Link>
          </p>
          <Link
            href="/"
            className="inline-block mt-2 py-2 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
          >
            ← Continue shopping
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
