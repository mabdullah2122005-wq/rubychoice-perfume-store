/**
 * Lightweight skeleton placeholders used by route loading.tsx files.
 * Uses an inline shimmer animation so we don't depend on a library.
 * Keep colors on-theme so the loader doesn't flash white during SSR.
 */
export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden
      className={`relative overflow-hidden rounded-md bg-cream-dark ${className}`}
      style={style}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-cream to-transparent" />
    </div>
  );
}

/** Matches the storefront ProductCard silhouette (image + meta + price). */
export function ProductCardSkeleton() {
  return (
    <div className="card-panel p-3">
      <Skeleton className="aspect-[4/5] w-full rounded-xl" />
      <div className="mt-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );
}

/** Grid wrapper matching the homepage / shop carousel rhythm. */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
