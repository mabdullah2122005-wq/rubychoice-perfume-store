import { ProductGridSkeleton } from "@/components/Skeleton";

/** Shown while the shop page waits for the product list query to resolve. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6 h-3 w-24 animate-pulse rounded bg-cream-dark" />
      <div className="mb-8 h-10 w-1/2 animate-pulse rounded bg-cream-dark" />
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Filter rail */}
        <aside className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-1/2 animate-pulse rounded bg-cream-dark" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-cream-dark" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-cream-dark" />
            </div>
          ))}
        </aside>
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  );
}
