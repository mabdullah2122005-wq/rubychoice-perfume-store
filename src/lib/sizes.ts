// Per-size pricing. A product's base size (sizeMl/priceCents) plus optional
// extra sizes stored as JSON. Used on both server and client — keep it pure.

export type ProductSize = { ml: number; priceCents: number; compareAtCents: number | null };

type SizeSource = {
  sizeMl: number;
  priceCents: number;
  compareAtCents?: number | null;
  sizes?: unknown; // Prisma Json column
};

export function parseSizes(raw: unknown): ProductSize[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (s): s is { ml: number; priceCents: number; compareAtCents?: unknown } =>
        Boolean(s) &&
        typeof (s as { ml?: unknown }).ml === "number" &&
        typeof (s as { priceCents?: unknown }).priceCents === "number" &&
        (s as { ml: number }).ml > 0 &&
        (s as { priceCents: number }).priceCents > 0
    )
    .map((s) => ({
      ml: s.ml,
      priceCents: s.priceCents,
      compareAtCents: typeof s.compareAtCents === "number" ? s.compareAtCents : null,
    }));
}

/** Base size + extra sizes, de-duplicated by ml, sorted ascending. */
export function allSizes(p: SizeSource): ProductSize[] {
  const base: ProductSize = {
    ml: p.sizeMl,
    priceCents: p.priceCents,
    compareAtCents: p.compareAtCents ?? null,
  };
  const byMl = new Map<number, ProductSize>();
  for (const s of [base, ...parseSizes(p.sizes)]) byMl.set(s.ml, s);
  return [...byMl.values()].sort((a, b) => a.ml - b.ml);
}

/** True when the product offers more than one size to choose from. */
export function hasMultipleSizes(p: SizeSource): boolean {
  return allSizes(p).length > 1;
}

/** The size selected by default (the product's base size). */
export function defaultSizeMl(p: SizeSource): number {
  return p.sizeMl;
}

/** Look up a size by ml — returns null if the product doesn't offer it. */
export function findSize(p: SizeSource, ml: number): ProductSize | null {
  return allSizes(p).find((s) => s.ml === ml) ?? null;
}

/** Lowest price across sizes — for "from Rs …" style listings. */
export function fromPriceCents(p: SizeSource): number {
  return Math.min(...allSizes(p).map((s) => s.priceCents));
}
