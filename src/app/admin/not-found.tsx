import Link from "next/link";

/** Friendly 404 inside the admin chrome. */
export default function AdminNotFound() {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-wine">404 — not found</p>
      <h1 className="mt-3 font-serif text-3xl">We couldn&apos;t find that record</h1>
      <p className="mt-3 text-sm text-ink-soft">
        The product, order, or coupon may have been removed.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/admin" className="btn-primary">
          Back to dashboard
        </Link>
        <Link href="/admin/products" className="btn-outline">
          View products
        </Link>
      </div>
    </div>
  );
}
