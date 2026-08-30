"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import { useToast } from "./ToastProvider";

type Props = {
  product: {
    id: string;
    slug: string;
    name: string;
    priceCents: number;
    image: string;
    sizeMl: number;
    stock: number;
  };
  showQuantity?: boolean;
};

export default function AddToCartButton({ product, showQuantity = false }: Props) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const soldOut = product.stock <= 0;

  function handleAdd() {
    addItem(
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        priceCents: product.priceCents,
        image: product.image,
        sizeMl: product.sizeMl,
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
    toast("success", `Added ${product.name} to cart`);
  }

  return (
    <div className="flex items-stretch gap-3">
      {showQuantity && !soldOut && (
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
      )}
      <button
        type="button"
        onClick={handleAdd}
        disabled={soldOut}
        className="btn-primary flex-1 !px-6 !py-3"
      >
        {soldOut ? "Sold out" : added ? "Added ✓" : "Add to cart"}
      </button>
    </div>
  );
}
