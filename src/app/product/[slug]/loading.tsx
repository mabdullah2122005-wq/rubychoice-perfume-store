export default function Loading() {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-2 md:py-16">
      {/* Gallery */}
      <div className="aspect-square animate-pulse rounded-2xl bg-cream-dark" />
      {/* Buy box */}
      <div className="space-y-4">
        <div className="h-3 w-24 animate-pulse rounded bg-cream-dark" />
        <div className="h-10 w-3/4 animate-pulse rounded bg-cream-dark" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-cream-dark" />
        <div className="h-8 w-1/3 animate-pulse rounded bg-cream-dark" />
        <div className="h-12 w-full animate-pulse rounded-2xl bg-cream-dark" />
        <div className="h-12 w-full animate-pulse rounded-2xl bg-cream-dark" />
        <div className="space-y-2 pt-6">
          <div className="h-3 w-full animate-pulse rounded bg-cream-dark" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-cream-dark" />
          <div className="h-3 w-4/6 animate-pulse rounded bg-cream-dark" />
        </div>
      </div>
    </div>
  );
}
