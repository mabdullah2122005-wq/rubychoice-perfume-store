"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFavourites } from "./FavouritesProvider";
import ProductCard, { type ProductCardData } from "./ProductCard";

export default function FavouritesGrid() {
  const { favourites, count, clear } = useFavourites();
  const [products, setProducts] = useState<ProductCardData[] | null>(null);

  const ids = favourites.map((f) => f.id).join(",");

  useEffect(() => {
    if (!ids) {
      setProducts([]);
      return;
    }
    let cancelled = false;
    setProducts(null);
    fetch(`/api/products/by-ids?ids=${encodeURIComponent(ids)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setProducts(data.products ?? []);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [ids]);

  if (count === 0) {
    return (
      <div className="py-20 text-center">
        <p className="font-serif text-2xl">No favourites yet</p>
        <p className="mt-2 text-sm text-ink-soft">
          Tap the heart on any fragrance to save it here — no account needed.
        </p>
        <Link href="/shop" className="btn-primary mt-6">
          Browse the collection
        </Link>
      </div>
    );
  }

  if (products === null) {
    return (
      <div className="flex justify-center py-20">
        <span
          role="status"
          aria-label="Loading your favourites"
          className="h-8 w-8 animate-spin rounded-full border-2 border-parchment border-t-ink"
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-ink-soft">
          {count} saved {count === 1 ? "fragrance" : "fragrances"}
        </p>
        <button
          type="button"
          onClick={clear}
          className="text-xs uppercase tracking-widest text-ink-soft transition hover:text-wine"
        >
          Clear all
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
