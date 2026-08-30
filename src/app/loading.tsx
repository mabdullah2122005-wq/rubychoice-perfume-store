import { ProductGridSkeleton } from "@/components/Skeleton";

/**
 * Shown by Next.js while the homepage's cached data resolves.
 * Mirrors the best-sellers carousel rhythm so the layout doesn't jump.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-6 h-3 w-32 animate-pulse rounded bg-cream-dark" />
      <div className="mb-8 h-10 w-2/3 animate-pulse rounded bg-cream-dark" />
      <ProductGridSkeleton count={8} />
    </div>
  );
}
