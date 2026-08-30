export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 h-3 w-24 animate-pulse rounded bg-cream-dark" />
      <div className="mb-8 h-10 w-2/3 animate-pulse rounded bg-cream-dark" />
      <div className="space-y-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-full animate-pulse rounded-2xl bg-cream-dark" />
        ))}
      </div>
    </div>
  );
}
