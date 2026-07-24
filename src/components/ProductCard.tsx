"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { allSizes, defaultSizeMl } from "@/lib/sizes";
import { useCart } from "./CartProvider";
import FavouriteButton from "./FavouriteButton";
import StarRating from "./StarRating";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  productType?: string;
  scentFamily: string;
  notesTop?: string;
  priceCents: number;
  compareAtCents: number | null;
  sizeMl: number;
  stock: number;
  image: string;
  /** Extra size options (Prisma Json). Falls back to the single base size. */
  sizes?: unknown;
  /** Pass `reviews: { select: { rating: true } }` from the query to show stars. */
  reviews?: { rating: number }[];
};

export default function ProductCard({ product }: { product: ProductCardData }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const sizeOptions = allSizes(product);
  const [selectedMl, setSelectedMl] = useState(defaultSizeMl(product));
  const selected = sizeOptions.find((s) => s.ml === selectedMl) ?? sizeOptions[0];

  const soldOut = product.stock <= 0;
  const lowStock = !soldOut && product.stock <= 5;
  const isAttar = product.productType === "Attar Oil";
  const discount =
    selected.compareAtCents && selected.compareAtCents > selected.priceCents
      ? Math.round(100 - (selected.priceCents / selected.compareAtCents) * 100)
      : 0;
  const reviewCount = product.reviews?.length ?? 0;
  const avgRating =
    reviewCount > 0
      ? product.reviews!.reduce((s, r) => s + r.rating, 0) / reviewCount
      : null;

  function quickAdd() {
    addItem({
      id: product.id,
      slug: product.slug,
      name: product.name,
      priceCents: selected.priceCents,
      image: product.image,
      sizeMl: selected.ml,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <article className="group card-panel relative flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-ink/30 hover:shadow-xl hover:shadow-black/10">
      <div className="absolute right-2 top-2 z-10">
        <FavouriteButton
          product={{
            id: product.id,
            slug: product.slug,
            name: product.name,
            image: product.image,
            priceCents: product.priceCents,
            sizeMl: product.sizeMl,
          }}
        />
      </div>
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden bg-cream-dark"
      >
        <Image
          src={product.image}
          alt={`${product.name} bottle`}
          fill
          sizes="(max-width: 640px) 70vw, (max-width: 1024px) 40vw, 280px"
          className="object-cover transition duration-700 group-hover:scale-[1.06]"
        />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
        <span className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {soldOut && (
            <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-cream">
              Sold out
            </span>
          )}
          {!soldOut && discount > 0 && (
            <span className="rounded-full bg-wine px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-cream">
              −{discount}%
            </span>
          )}
          {isAttar && (
            <span className="rounded-full bg-gold px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-cream">
              Attar
            </span>
          )}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="text-[9px] uppercase tracking-widest text-gold sm:text-[10px]">
          {product.scentFamily}
        </p>
        <Link href={`/product/${product.slug}`} className="mt-1">
          <h3 className="font-serif text-base leading-snug transition group-hover:text-gold sm:text-xl">
            {product.name}
          </h3>
        </Link>
        <p className="mt-0.5 line-clamp-1 text-xs text-ink-soft sm:text-sm">{product.tagline}</p>

        {avgRating !== null && (
          <span className="mt-2 flex items-center gap-1.5 text-xs text-ink-soft">
            <StarRating value={avgRating} size={12} />
            {avgRating.toFixed(1)} ({reviewCount})
          </span>
        )}

        {/* Size (ml) selector — changes the price live */}
        {sizeOptions.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Select size">
            {sizeOptions.map((s) => {
              const active = s.ml === selectedMl;
              return (
                <button
                  key={s.ml}
                  type="button"
                  onClick={() => setSelectedMl(s.ml)}
                  aria-pressed={active}
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-medium tabular-nums transition ${
                    active
                      ? "border-ink bg-ink text-cream"
                      : "border-parchment text-ink-soft hover:border-ink/50 hover:text-ink"
                  }`}
                >
                  {s.ml} ml
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-auto flex items-baseline gap-2 pt-3">
          <span className="text-sm font-semibold sm:text-base">{formatPrice(selected.priceCents)}</span>
          {discount > 0 && (
            <span className="text-xs text-ink-soft line-through">
              {formatPrice(selected.compareAtCents!)}
            </span>
          )}
        </div>
        {lowStock && (
          <p className="mt-1 text-[10px] text-wine sm:text-[11px]">Only {product.stock} left in this batch</p>
        )}

        <button
          type="button"
          onClick={quickAdd}
          disabled={soldOut}
          className={`mt-2.5 w-full rounded-full border py-2 text-[10px] font-medium uppercase tracking-[0.18em] transition active:scale-[0.98] sm:mt-3 sm:py-2.5 sm:text-[11px] ${
            added
              ? "border-gold bg-gold text-cream"
              : "border-ink/25 text-ink hover:border-gold hover:bg-gold hover:text-cream"
          } disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {soldOut ? "Sold out" : added ? "Added to cart ✓" : "Add to cart"}
        </button>
      </div>
    </article>
  );
}
