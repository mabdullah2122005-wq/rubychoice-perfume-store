"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "./CartProvider";
import { useFavourites } from "./FavouritesProvider";
import { formatPrice } from "@/lib/format";

/**
 * Homepage reminder strip of the shopper's saved fragrances. Renders nothing
 * for visitors with no favourites, so first-time visitors never see it.
 */
export default function FavouritesReminder() {
  const { favourites, count } = useFavourites();
  const { addItem } = useCart();

  if (count === 0) return null;

  return (
    <section className="border-y border-parchment bg-cream-dark">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-wine">Don&apos;t forget</p>
            <h2 className="mt-1 font-serif text-2xl sm:text-4xl">Your favourites</h2>
          </div>
          <Link href="/favourites" className="nav-link text-sm text-gold">
            View all →
          </Link>
        </div>

        <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto scroll-px-4 px-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0">
          {favourites.slice(0, 12).map((item) => (
            <div
              key={item.id}
              className="w-40 shrink-0 snap-start sm:w-48"
            >
              <Link
                href={`/product/${item.slug}`}
                className="group block overflow-hidden rounded-2xl border border-parchment bg-cream"
              >
                <span className="relative block aspect-[4/5] overflow-hidden bg-cream-dark">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="192px"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                </span>
                <span className="block p-3">
                  <span className="block truncate font-serif text-sm group-hover:text-gold-dark">
                    {item.name}
                  </span>
                  <span className="block text-xs text-ink-soft">{formatPrice(item.priceCents)}</span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() =>
                  addItem({
                    id: item.id,
                    slug: item.slug,
                    name: item.name,
                    priceCents: item.priceCents,
                    image: item.image,
                    sizeMl: item.sizeMl,
                  })
                }
                className="mt-2 w-full rounded-full border border-ink/20 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] transition hover:border-gold hover:bg-gold hover:text-cream"
              >
                Add to cart
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
