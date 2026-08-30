export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6 h-3 w-32 animate-pulse rounded bg-cream-dark" />
      <div className="mb-2 h-10 w-1/3 animate-pulse rounded bg-cream-dark" />
      <div className="mb-8 h-4 w-1/2 animate-pulse rounded bg-cream-dark" />
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card-panel p-5">
            <div className="h-3 w-1/2 animate-pulse rounded bg-cream-dark" />
            <div className="mt-3 h-8 w-3/4 animate-pulse rounded bg-cream-dark" />
          </div>
        ))}
      </div>
      {/* Chart + table */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card-panel h-72 animate-pulse rounded-2xl bg-cream-dark" />
        <div className="card-panel h-72 animate-pulse rounded-2xl bg-cream-dark" />
      </div>
    </div>
  );
}
