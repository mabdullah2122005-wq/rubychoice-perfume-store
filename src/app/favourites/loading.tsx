import { ProductGridSkeleton } from "@/components/Skeleton";

/** Shown while favourites are loading. Minimal — the page is client-driven. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 h-10 w-1/3 animate-pulse rounded bg-cream-dark" />
      <ProductGridSkeleton count={4} />
    </div>
  );
}
