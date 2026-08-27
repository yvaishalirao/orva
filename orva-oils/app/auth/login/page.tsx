'use client';

import { Suspense, useState } from 'react';
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
    <main className="max-w-md mx-auto px-8 py-24 text-center">
      <h1 className="font-headline text-3xl font-extrabold tracking-tight text-primary mb-3">
        Sign in to continue
      </h1>
      <p className="text-on-surface-variant text-sm mb-10">
        Sign in with Google to checkout and track your orders.
      </p>

      {error && (
        <p className="text-error text-sm mb-4 bg-error-container/30 px-4 py-3 rounded-xl">{error}</p>
      )}

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="btn-primary w-full py-4 rounded-xl font-bold text-base disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Redirecting…' : 'Continue with Google'}
      </button>
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
