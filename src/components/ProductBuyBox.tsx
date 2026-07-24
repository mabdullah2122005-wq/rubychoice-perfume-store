"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { allSizes, defaultSizeMl } from "@/lib/sizes";
import { useCart } from "./CartProvider";
import FavouriteButton from "./FavouriteButton";
import BackInStockForm from "./BackInStockForm";

type BuyProduct = {
  id: string;
  slug: string;
  name: string;
  image: string;
  stock: number;
  sizeMl: number;
  priceCents: number;
  compareAtCents: number | null;
  sizes?: unknown;
};

export default function ProductBuyBox({ product }: { product: BuyProduct }) {
  const { addItem } = useCart();
  const sizeOptions = allSizes(product);
  const [selectedMl, setSelectedMl] = useState(defaultSizeMl(product));
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const selected = sizeOptions.find((s) => s.ml === selectedMl) ?? sizeOptions[0];
  const soldOut = product.stock <= 0;
  const discount =
    selected.compareAtCents && selected.compareAtCents > selected.priceCents
      ? Math.round(100 - (selected.priceCents / selected.compareAtCents) * 100)
      : 0;

  function handleAdd() {
    addItem(
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        priceCents: selected.priceCents,
        image: product.image,
        sizeMl: selected.ml,
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  return (
    <div>
      <p className="mt-5 flex items-baseline gap-3 text-2xl">
        <span className="font-medium">{formatPrice(selected.priceCents)}</span>
        {discount > 0 && (
          <>
            <span className="text-lg text-ink-soft line-through">
              {formatPrice(selected.compareAtCents!)}
            </span>
            <span className="rounded-full bg-wine px-2 py-0.5 text-xs font-medium text-cream">
              −{discount}%
            </span>
          </>
        )}
      </p>

      {/* Size selector */}
      {sizeOptions.length > 1 && (
        <div className="mt-5">
          <p className="mb-2 text-xs uppercase tracking-widest text-ink-soft">Size</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Select size">
            {sizeOptions.map((s) => {
              const active = s.ml === selectedMl;
              return (
                <button
                  key={s.ml}
                  type="button"
                  onClick={() => setSelectedMl(s.ml)}
                  aria-pressed={active}
                  className={`flex min-w-16 flex-col items-center rounded-xl border px-3 py-2 transition ${
                    active
                      ? "border-ink bg-ink text-cream"
                      : "border-parchment hover:border-ink/50"
                  }`}
                >
                  <span className="text-sm font-medium tabular-nums">{s.ml} ml</span>
                  <span className={`text-[11px] ${active ? "text-cream/80" : "text-ink-soft"}`}>
                    {formatPrice(s.priceCents)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!soldOut && product.stock <= 5 && (
        <p className="mt-3 text-sm text-wine">Only {product.stock} left in this batch.</p>
      )}

      {soldOut ? (
        <BackInStockForm slug={product.slug} />
      ) : (
        <div className="mt-6 flex items-stretch gap-3">
          <div className="flex items-center rounded-full border border-parchment bg-surface">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-4 py-2 text-lg leading-none transition hover:text-gold"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-8 text-center text-sm" aria-live="polite">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(10, q + 1))}
              className="px-4 py-2 text-lg leading-none transition hover:text-gold"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <button type="button" onClick={handleAdd} className="btn-primary flex-1 !px-6 !py-3">
            {added ? "Added ✓" : `Add ${selected.ml} ml to cart`}
          </button>
          <FavouriteButton
            variant="full"
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
      )}
    </div>
  );
}
