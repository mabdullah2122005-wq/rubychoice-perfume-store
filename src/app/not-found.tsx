import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-28 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-gold-dark">404</p>
      <h1 className="mt-3 font-serif text-5xl">This page has evaporated</h1>
      <p className="mt-4 text-ink-soft">
        Like a top note, it was here a moment ago.
      </p>
      <Link href="/" className="btn-primary mt-8">
        Return home
      </Link>
    </div>
  );
}
