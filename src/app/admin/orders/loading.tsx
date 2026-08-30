export default function Loading() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div
          key={i}
          className="h-14 w-full animate-pulse rounded-2xl bg-cream-dark"
        />
      ))}
    </div>
  );
}
