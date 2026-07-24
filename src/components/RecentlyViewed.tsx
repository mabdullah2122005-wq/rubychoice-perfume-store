"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";

const KEY = "rubychoice-recent-v1";
const MAX = 8;

type RecentItem = {
  slug: string;
  name: string;
  image: string;
  priceCents: number;
};

function readRecent(): RecentItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i) => i && typeof i.slug === "string" && typeof i.priceCents === "number"
    );
  } catch {
    return [];
  }
}

/** Drop this on a product page to record the visit (renders nothing). */
export function RecentlyViewedTracker({ item }: { item: RecentItem }) {
  useEffect(() => {
    try {
      const rest = readRecent().filter((i) => i.slug !== item.slug);
      localStorage.setItem(KEY, JSON.stringify([item, ...rest].slice(0, MAX)));
    } catch {}
  }, [item]);
  return null;
}

/** Horizontal strip of the shopper's recently viewed products. */
export default function RecentlyViewed({ excludeSlug }: { excludeSlug?: string }) {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    setItems(readRecent().filter((i) => i.slug !== excludeSlug));
  }, [excludeSlug]);

  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-xs uppercase tracking-[0.3em] text-gold">Pick up where you left off</p>
      <h2 className="mt-1 font-serif text-2xl sm:text-3xl">Recently viewed</h2>
      <div className="no-scrollbar -mx-4 mt-5 flex snap-x gap-3 overflow-x-auto scroll-px-4 px-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/product/${item.slug}`}
            className="group w-28 shrink-0 snap-start sm:w-36"
          >
            <span className="relative block aspect-[4/5] overflow-hidden rounded-xl border border-parchment bg-cream-dark">
              <Image
                src={item.image}
                alt=""
                fill
                sizes="144px"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            </span>
            <span className="mt-1.5 block truncate font-serif text-sm group-hover:text-gold-dark">
              {item.name}
            </span>
            <span className="block text-xs text-ink-soft">{formatPrice(item.priceCents)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
