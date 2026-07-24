export default function PolicyLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-xs uppercase tracking-[0.3em] text-gold">Policies</p>
      <h1 className="mt-1 font-serif text-4xl sm:text-5xl">{title}</h1>
      <p className="mt-3 text-xs text-ink-soft">Last updated {updated}</p>
      <div className="policy mt-8 space-y-5 text-sm leading-relaxed text-ink-soft">
        {children}
      </div>
    </div>
  );
}
