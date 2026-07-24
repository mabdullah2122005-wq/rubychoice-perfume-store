"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart, cartLineId } from "./CartProvider";
import FreeShippingBar from "./FreeShippingBar";
import { formatPrice } from "@/lib/format";

/**
 * Slide-out mini cart. CartProvider opens it whenever an item is added;
 * the header cart icon opens it too. Escape / overlay click closes.
 */
export default function CartDrawer() {
  const { items, subtotalCents, isOpen, closeCart, setQuantity, removeItem } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKey);
    // Lock page scroll behind the drawer.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [isOpen, closeCart]);

  return (
    <div
      className={`fixed inset-0 z-[60] ${isOpen ? "" : "pointer-events-none"}`}
      aria-hidden={!isOpen}
    >
      {/* Overlay */}
      <div
        onClick={closeCart}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-cream shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-parchment px-5 py-4">
          <h2 className="font-serif text-xl">
            Your cart{items.length > 0 ? ` (${items.reduce((s, i) => s + i.quantity, 0)})` : ""}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="p-1 text-ink-soft transition hover:text-ink"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="font-serif text-2xl">Your cart is empty</p>
            <p className="text-sm text-ink-soft">The collection is waiting to be discovered.</p>
            <Link href="/shop" onClick={closeCart} className="btn-primary mt-2">
              Browse fragrances
            </Link>
          </div>
        ) : (
          <>
            {/* Free-delivery nudge (colour-shifting) */}
            <div className="border-b border-parchment px-5 py-3">
              <FreeShippingBar compact />
            </div>

            <ul className="flex-1 divide-y divide-parchment overflow-y-auto px-5">
              {items.map((item) => (
                <li key={cartLineId(item)} className="flex gap-3 py-4">
                  <Link
                    href={`/product/${item.slug}`}
                    onClick={closeCart}
                    className="relative block h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-parchment bg-cream-dark"
                  >
                    <Image src={item.image} alt="" fill sizes="64px" className="object-cover" />
                  </Link>
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex justify-between gap-2">
                      <div>
                        <Link
                          href={`/product/${item.slug}`}
                          onClick={closeCart}
                          className="font-serif text-sm leading-snug hover:text-gold-dark"
                        >
                          {item.name}
                        </Link>
                        <p className="text-[11px] text-ink-soft">{item.sizeMl} ml</p>
                      </div>
                      <span className="text-sm font-medium">
                        {formatPrice(item.priceCents * item.quantity)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-parchment bg-surface text-sm">
                        <button
                          type="button"
                          onClick={() => setQuantity(cartLineId(item), item.quantity - 1)}
                          className="px-2.5 py-0.5 transition hover:text-gold"
                          aria-label={`Decrease ${item.name} quantity`}
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-xs">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity(cartLineId(item), item.quantity + 1)}
                          className="px-2.5 py-0.5 transition hover:text-gold"
                          aria-label={`Increase ${item.name} quantity`}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(cartLineId(item))}
                        className="text-[10px] uppercase tracking-widest text-wine hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="space-y-3 border-t border-parchment px-5 py-4">
              <div className="flex justify-between text-sm">
                <span className="text-ink-soft">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotalCents)}</span>
              </div>
              <p className="text-xs text-ink-soft">
                Shipping and discount codes are applied at checkout.
              </p>
              <Link href="/checkout" onClick={closeCart} className="btn-primary w-full">
                Checkout
              </Link>
              <Link
                href="/cart"
                onClick={closeCart}
                className="block text-center text-xs uppercase tracking-widest text-ink-soft hover:text-ink"
              >
                View full cart
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
