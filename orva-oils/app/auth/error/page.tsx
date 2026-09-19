import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <main className="max-w-md mx-auto px-8 py-24 text-center">
      <h1 className="font-headline text-3xl font-extrabold tracking-tight text-primary mb-3">
        Sign-in failed
      </h1>
      <p className="text-on-surface-variant text-sm mb-10">
        Something went wrong signing you in. This can happen if the sign-in was cancelled or timed out — try again.
      </p>
      <Link
        href="/auth/login"
        className="btn-primary inline-block w-full py-4 rounded-xl font-bold text-base"
      >
        Try again
      </Link>
    </main>
  );
}
