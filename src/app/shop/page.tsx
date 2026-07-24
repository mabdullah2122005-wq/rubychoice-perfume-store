import { Suspense } from "react";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { db } from "@/lib/db";
import { site } from "@/lib/site";
import ShopFilters from "@/components/ShopFilters";
import InfiniteProductGrid from "@/components/InfiniteProductGrid";

export const metadata: Metadata = {
  title: "Shop all fragrances",
  description: `Browse the complete ${site.name} collection — floral, woody, amber, fresh, citrus and gourmand eaux de parfum.`,
};

const PAGE_SIZE = 12;

function str(v: string | string[] | undefined): string {
  return typeof v === "string" ? v.slice(0, 100) : "";
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = str(params.q);
  const family = str(params.family);
  const gender = str(params.gender);
  const type = str(params.type);
  const sort = str(params.sort) || "new";

  const where: Prisma.ProductWhereInput = { published: true };
  if (family && (site.scentFamilies as readonly string[]).includes(family)) {
    where.scentFamily = family;
  }
  if (gender && (site.genders as readonly string[]).includes(gender)) {
    where.gender = gender;
  }
  if (type && (site.productTypes as readonly string[]).includes(type)) {
    where.productType = type;
  }
  if (q) {
    // mode: "insensitive" — Postgres LIKE is case-sensitive by default.
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { tagline: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { notesTop: { contains: q, mode: "insensitive" } },
      { notesHeart: { contains: q, mode: "insensitive" } },
      { notesBase: { contains: q, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price-asc"
      ? { priceCents: "asc" }
      : sort === "price-desc"
        ? { priceCents: "desc" }
        : sort === "name"
          ? { name: "asc" }
          : { createdAt: "desc" };

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      take: PAGE_SIZE,
      include: { reviews: { select: { rating: true } } },
    }),
    db.product.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Lean, serializable card data for the client grid (it appends the next
  // pages itself from /api/products).
  const cards = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    productType: p.productType,
    scentFamily: p.scentFamily,
    notesTop: p.notesTop,
    priceCents: p.priceCents,
    compareAtCents: p.compareAtCents,
    sizeMl: p.sizeMl,
    sizes: p.sizes,
    stock: p.stock,
    image: p.image,
    reviews: p.reviews,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">The collection</p>
        <h1 className="mt-1 font-serif text-3xl sm:text-4xl">
          {type === "Attar Oil"
            ? "Attars — concentrated oils"
            : family
              ? `${family} fragrances`
              : "All fragrances"}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          {total} composition{total === 1 ? "" : "s"}
          {q ? ` matching “${q}”` : ""}
        </p>
      </div>

      <Suspense>
        <ShopFilters />
      </Suspense>

      {cards.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-serif text-2xl">Nothing matches that search.</p>
          <p className="mt-2 text-sm text-ink-soft">
            Try a different note, or{" "}
            <Link href="/shop" className="text-gold-dark underline">
              browse everything
            </Link>
            .
          </p>
        </div>
      ) : (
        <InfiniteProductGrid
          // Remount (and reset paging) whenever the filters change.
          key={`${q}|${family}|${gender}|${type}|${sort}`}
          initial={cards}
          total={total}
          totalPages={totalPages}
          filters={{ q, family, gender, type, sort }}
        />
      )}
    </div>
  );
}
