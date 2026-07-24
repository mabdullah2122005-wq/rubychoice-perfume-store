"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart, cartLineId } from "@/components/CartProvider";
import FreeShippingBar from "@/components/FreeShippingBar";
import { formatPrice } from "@/lib/format";
import { site } from "@/lib/site";

export default function CartPage() {
  const { items, subtotalCents, setQuantity, removeItem } = useCart();

  const shippingCents =
    subtotalCents >= site.freeShippingThresholdCents || subtotalCents === 0
      ? 0
      : site.shippingFlatCents;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-serif text-4xl">Your cart is empty</h1>
        <p className="mt-3 text-ink-soft">
          The collection is waiting to be discovered.
        </p>
        <Link href="/shop" className="btn-primary mt-8">
          Browse fragrances
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-28 pt-10 sm:px-6 md:pb-10">
      <h1 className="font-serif text-4xl">Your cart</h1>

      <ul className="mt-8 divide-y divide-parchment border-y border-parchment">
        {items.map((item) => (
          <li key={cartLineId(item)} className="flex gap-4 py-5">
            <Link href={`/product/${item.slug}`} className="relative block h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-parchment bg-cream-dark">
              <Image src={item.image} alt="" fill sizes="80px" className="object-cover" />
            </Link>
            <div className="flex flex-1 flex-col justify-between">
              <div className="flex justify-between gap-4">
                <div>
                  <Link href={`/product/${item.slug}`} className="font-serif text-lg hover:text-gold-dark">
                    {item.name}
                  </Link>
                  <p className="text-xs text-ink-soft">{item.sizeMl} ml</p>
                </div>
                <p className="text-sm font-medium">
                  {formatPrice(item.priceCents * item.quantity)}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center rounded-full border border-parchment bg-surface">
                  <button
                    type="button"
                    onClick={() => setQuantity(cartLineId(item), item.quantity - 1)}
                    className="px-3.5 py-1 transition hover:text-gold"
                    aria-label={`Decrease ${item.name} quantity`}
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(cartLineId(item), item.quantity + 1)}
                    className="px-3.5 py-1 transition hover:text-gold"
                    aria-label={`Increase ${item.name} quantity`}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(cartLineId(item))}
                  className="text-xs uppercase tracking-widest text-wine hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Colour-shifting free-delivery progress */}
      <div className="mt-6">
        <FreeShippingBar />
      </div>

      {/* Reassurance strip */}
      <ul className="mt-4 grid grid-cols-3 gap-3 text-center text-[11px] text-ink-soft">
        {[
          { t: "Cash on Delivery", s: "Pay when it arrives" },
          { t: "2–4 day delivery", s: "TCS / Leopards" },
          { t: "7-day returns", s: "On unopened bottles" },
        ].map((b) => (
          <li key={b.t} className="rounded-xl border border-parchment bg-surface px-2 py-3">
            <p className="font-medium text-ink">{b.t}</p>
            <p className="mt-0.5">{b.s}</p>
          </li>
        ))}
      </ul>

      <div className="card-panel mt-6 ml-auto max-w-sm space-y-2 p-5 text-sm">
        <div className="flex justify-between">
          <span className="text-ink-soft">Subtotal</span>
          <span>{formatPrice(subtotalCents)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-soft">Delivery (Cash on Delivery)</span>
          <span>{shippingCents === 0 ? "Free" : formatPrice(shippingCents)}</span>
        </div>
        {shippingCents > 0 && (
          <p className="text-xs text-ink-soft">
            Pay online (card, PayFast or bank transfer) and shipping is{" "}
            <span className="font-medium text-ink">free</span> — pick your
            method at checkout.
          </p>
        )}
        <div className="flex justify-between border-t border-parchment pt-2 text-base font-medium">
          <span>Total</span>
          <span>{formatPrice(subtotalCents + shippingCents)}</span>
        </div>
        <p className="text-xs text-ink-soft">
          Prices are confirmed against the catalog at checkout — discount codes
          are applied there too.
        </p>
        <Link href="/checkout" className="btn-primary mt-4 w-full">
          Proceed to checkout
        </Link>
      </div>

      {/* Sticky checkout bar on phones */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-parchment bg-cream/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <p className="text-[11px] text-ink-soft">Total</p>
            <p className="font-serif text-lg leading-none">{formatPrice(subtotalCents + shippingCents)}</p>
          </div>
          <Link href="/checkout" className="btn-primary flex-1 text-center">
            Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
