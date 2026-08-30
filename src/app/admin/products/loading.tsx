export default function Loading() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="card-panel h-44 animate-pulse rounded-2xl bg-cream-dark"
        />
      ))}
    </div>
  );
}
