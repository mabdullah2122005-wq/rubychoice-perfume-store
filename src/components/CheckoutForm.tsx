"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart, cartLineId } from "@/components/CartProvider";
import { formatPrice } from "@/lib/format";
import { site, shippingCentsFor } from "@/lib/site";

const inputClass = "field";

type Method = "COD" | "BANK" | "CARD" | "PAYFAST";

const methodOptions: { value: Method; title: string; text: string }[] = [
  {
    value: "COD",
    title: "Cash on Delivery",
    text: `Pay the rider in cash when your order arrives. Delivery ${formatPrice(site.shippingFlatCents)} — free over ${formatPrice(site.freeShippingThresholdCents)}.`,
  },
  {
    value: "BANK",
    title: "Bank transfer — free shipping",
    text: "Transfer to our account; we ship as soon as it clears (details on the next page).",
  },
  {
    value: "CARD",
    title: "Debit / credit card — free shipping",
    text: "Visa or Mastercard. Enter your card details below.",
  },
  {
    value: "PAYFAST",
    title: "PayFast — free shipping",
    text: "Cards, wallets and bank accounts. You'll be redirected to PayFast's secure payment page.",
  },
];

// --- Card input helpers (validation happens in the browser only — the card
// number, expiry and CVC are never included in any request to our server). ---

function luhnValid(digits: string): boolean {
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

function cardBrand(digits: string): string | null {
  if (/^4/.test(digits)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "American Express";
  if (/^(62|81)/.test(digits)) return "UnionPay";
  return null;
}

function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

function expiryValid(value: string): boolean {
  const match = value.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;
  const month = Number(match[1]);
  if (month < 1 || month > 12) return false;
  const year = 2000 + Number(match[2]);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  return endOfMonth.getTime() >= Date.now();
}

// PayFast requires a form POST to its hosted page, not a plain redirect.
function submitGatewayForm(action: string, fields: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

export default function CheckoutForm({
  cardEnabled,
  payfastEnabled,
}: {
  cardEnabled: boolean;
  payfastEnabled: boolean;
}) {
  const { items, subtotalCents, clear } = useCart();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [gatewayNotice, setGatewayNotice] = useState("");
  const [method, setMethod] = useState<Method>("COD");
  const [couponInput, setCouponInput] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discountCents: number } | null>(null);
  const [card, setCard] = useState({ name: "", number: "", expiry: "", cvc: "" });
  const [form, setForm] = useState({
    email: "",
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    province: "Punjab",
    postalCode: "",
    country: "Pakistan",
  });

  useEffect(() => {
    // The PayFast return route sends failed payments back here.
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "failed") {
      setGatewayNotice(
        "Your online payment was not completed — nothing was charged. You can try again or choose Cash on Delivery."
      );
    }
  }, []);

  const shippingCents = shippingCentsFor(method, subtotalCents);
  const discountCents = coupon?.discountCents ?? 0;
  const totalCents = subtotalCents - discountCents + shippingCents;
  const brand = cardBrand(card.number.replace(/\D/g, ""));

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponBusy(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          items: items.map((i) => ({ id: i.id, sizeMl: i.sizeMl, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCoupon(null);
        setCouponError(data.error ?? "That code did not work.");
        return;
      }
      setCoupon({ code: data.code, discountCents: data.discountCents });
      setCouponInput("");
    } catch {
      setCouponError("Network error — please try again.");
    } finally {
      setCouponBusy(false);
    }
  }

  function removeCoupon() {
    setCoupon(null);
    setCouponError("");
  }

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function validateCard(): string {
    if (card.name.trim().length < 2) return "Enter the cardholder name.";
    if (!luhnValid(card.number.replace(/\D/g, "")))
      return "Check the card number — it doesn't look right.";
    if (!expiryValid(card.expiry)) return "Check the expiry date (MM/YY).";
    if (!/^\d{3,4}$/.test(card.cvc)) return "Enter the 3–4 digit security code.";
    return "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setGatewayNotice("");
    if (method === "CARD") {
      const cardError = validateCard();
      if (cardError) {
        setError(cardError);
        return;
      }
    }
    setBusy(true);
    try {
      // Card details are deliberately NOT sent — payment collection happens
      // on the gateway's PCI-compliant side, never on this server.
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, sizeMl: i.sizeMl, quantity: i.quantity })),
          paymentMethod: method,
          customer: form,
          ...(coupon ? { couponCode: coupon.code } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Checkout failed — please try again.");
        return;
      }
      if (data.payfast) {
        // Hand the customer to PayFast's hosted payment page.
        submitGatewayForm(data.payfast.action, data.payfast.fields);
        return;
      }
      if (data.url) {
        // Stripe-hosted payment page
        window.location.assign(data.url);
        return;
      }
      if (data.orderId) {
        clear();
        router.push(`/checkout/success?order=${data.orderId}`);
        return;
      }
      setError("Unexpected response — please try again.");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-serif text-4xl">Nothing to check out</h1>
        <Link href="/shop" className="btn-outline mt-8">
          Return to the shop
        </Link>
      </div>
    );
  }

  const visibleOptions = methodOptions.filter(
    (o) =>
      (o.value !== "CARD" || cardEnabled) &&
      (o.value !== "PAYFAST" || payfastEnabled)
  );

  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-4 py-10 sm:px-6 md:grid-cols-5">
      <form onSubmit={handleSubmit} className="space-y-6 md:col-span-3">
        <h1 className="font-serif text-4xl">Checkout</h1>

        {gatewayNotice && (
          <p className="border border-wine/40 bg-wine/5 px-3 py-2 text-sm text-wine" role="alert">
            {gatewayNotice}
          </p>
        )}

        <fieldset className="space-y-3">
          <legend className="mb-2 text-xs uppercase tracking-widest text-gold-dark">
            Contact
          </legend>
          <input type="email" required maxLength={254} placeholder="Email address" value={form.email} onChange={set("email")} className={inputClass} autoComplete="email" />
          <input
            type="tel"
            required
            minLength={10}
            maxLength={17}
            pattern="\+?[0-9][0-9 \-]{8,15}"
            placeholder="Mobile number (e.g. 0300-1234567)"
            value={form.phone}
            onChange={set("phone")}
            className={inputClass}
            autoComplete="tel"
          />
          <p className="text-xs text-ink-soft">Our courier calls this number before delivery.</p>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="mb-2 text-xs uppercase tracking-widest text-gold-dark">
            Shipping address
          </legend>
          <input type="text" required minLength={2} maxLength={80} placeholder="Full name" value={form.name} onChange={set("name")} className={inputClass} autoComplete="name" />
          <input type="text" required minLength={3} maxLength={120} placeholder="Address line 1" value={form.addressLine1} onChange={set("addressLine1")} className={inputClass} autoComplete="address-line1" />
          <input type="text" maxLength={120} placeholder="Address line 2 (optional)" value={form.addressLine2} onChange={set("addressLine2")} className={inputClass} autoComplete="address-line2" />
          <div className="grid grid-cols-2 gap-3">
            <input type="text" required maxLength={80} placeholder="City" value={form.city} onChange={set("city")} className={inputClass} autoComplete="address-level2" />
            <select value={form.province} onChange={set("province")} className={inputClass} aria-label="Province">
              {site.provinces.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" required minLength={2} maxLength={20} placeholder="Postal code" value={form.postalCode} onChange={set("postalCode")} className={inputClass} autoComplete="postal-code" />
            <input type="text" required minLength={2} maxLength={60} placeholder="Country" value={form.country} onChange={set("country")} className={inputClass} autoComplete="country-name" />
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="mb-2 text-xs uppercase tracking-widest text-gold-dark">
            Payment method
          </legend>
          {visibleOptions.map((option) => (
            <div key={option.value}>
              <label
                className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                  method === option.value
                    ? "border-gold bg-gold/10"
                    : "border-parchment bg-surface hover:border-gold/50"
                } ${method === option.value && option.value === "CARD" ? "rounded-b-none border-b-0" : ""}`}
              >
                <input
                  type="radio"
                  name="payment-method"
                  value={option.value}
                  checked={method === option.value}
                  onChange={() => setMethod(option.value)}
                  className="mt-1 accent-black"
                />
                <span>
                  <span className="block text-sm font-medium">{option.title}</span>
                  <span className="mt-0.5 block text-xs text-ink-soft">{option.text}</span>
                </span>
              </label>

              {/* Card details drop-down */}
              {option.value === "CARD" && method === "CARD" && (
                <div className="space-y-3 rounded-b-xl border border-t-0 border-gold bg-gold/5 p-4">
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Cardholder name"
                    maxLength={80}
                    value={card.name}
                    onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
                    autoComplete="cc-name"
                    aria-label="Cardholder name"
                  />
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      className={`${inputClass} pr-24`}
                      placeholder="Card number"
                      maxLength={23}
                      value={card.number}
                      onChange={(e) =>
                        setCard((c) => ({ ...c, number: formatCardNumber(e.target.value) }))
                      }
                      autoComplete="cc-number"
                      aria-label="Card number"
                    />
                    {brand && (
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium uppercase tracking-wide text-ink-soft">
                        {brand}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      inputMode="numeric"
                      className={inputClass}
                      placeholder="Expiry (MM/YY)"
                      maxLength={5}
                      value={card.expiry}
                      onChange={(e) =>
                        setCard((c) => ({ ...c, expiry: formatExpiry(e.target.value) }))
                      }
                      autoComplete="cc-exp"
                      aria-label="Card expiry date"
                    />
                    <input
                      type="password"
                      inputMode="numeric"
                      className={inputClass}
                      placeholder="CVC"
                      maxLength={4}
                      value={card.cvc}
                      onChange={(e) =>
                        setCard((c) => ({ ...c, cvc: e.target.value.replace(/\D/g, "") }))
                      }
                      autoComplete="cc-csc"
                      aria-label="Card security code"
                    />
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-ink-soft">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
                      <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 1 1 6 0v3H9z" />
                    </svg>
                    Your card is charged on a secure, PCI-compliant payment page —
                    the number is never sent to or stored on our servers.
                  </p>
                </div>
              )}
            </div>
          ))}
        </fieldset>

        {error && (
          <p className="border border-wine/40 bg-wine/5 px-3 py-2 text-sm text-wine" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="btn-primary w-full !py-4"
        >
          {busy
            ? "Placing your order…"
            : method === "COD"
              ? `Place order — pay ${formatPrice(totalCents)} on delivery`
              : method === "BANK"
                ? "Place order — get transfer details"
                : method === "PAYFAST"
                  ? `Continue to PayFast — ${formatPrice(totalCents)}`
                  : `Pay ${formatPrice(totalCents)} securely`}
        </button>
        <p className="text-center text-xs text-ink-soft">
          {method === "CARD"
            ? "Card payment is handled on a secure, PCI-compliant page. We never see your card number."
            : method === "PAYFAST"
              ? "You'll be redirected to PayFast to complete the payment, then brought straight back."
              : site.deliveryNote + "."}
        </p>
      </form>

      <aside className="md:col-span-2">
        <h2 className="text-xs uppercase tracking-widest text-gold-dark">Order summary</h2>
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={cartLineId(item)} className="flex items-center gap-3 text-sm">
              <span className="relative block h-14 w-11 shrink-0 overflow-hidden bg-cream-dark">
                <Image src={item.image} alt="" fill sizes="44px" className="object-cover" />
              </span>
              <span className="flex-1">
                {item.name} <span className="text-ink-soft">· {item.sizeMl} ml × {item.quantity}</span>
              </span>
              <span>{formatPrice(item.priceCents * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="card-panel mt-6 space-y-3 p-4 text-sm">
          {coupon ? (
            <div className="flex items-center justify-between rounded-lg border border-parchment bg-cream-dark px-3 py-2">
              <span className="text-xs">
                Code <span className="font-mono font-medium">{coupon.code}</span> applied
              </span>
              <button
                type="button"
                onClick={removeCoupon}
                className="text-xs uppercase tracking-widest text-wine hover:underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="field flex-1 uppercase"
                  placeholder="Discount code"
                  maxLength={40}
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyCoupon();
                    }
                  }}
                  aria-label="Discount code"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={couponBusy || couponInput.trim() === ""}
                  className="btn-outline !px-5 !py-2.5"
                >
                  {couponBusy ? "…" : "Apply"}
                </button>
              </div>
              {couponError && (
                <p className="mt-2 text-xs text-wine" role="alert">{couponError}</p>
              )}
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-ink-soft">Subtotal</span>
            <span>{formatPrice(subtotalCents)}</span>
          </div>
          {discountCents > 0 && (
            <div className="flex justify-between">
              <span className="text-ink-soft">Discount ({coupon!.code})</span>
              <span>−{formatPrice(discountCents)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-ink-soft">Shipping</span>
            <span>
              {shippingCents === 0
                ? method === "COD"
                  ? "Free"
                  : "Free — prepaid order"
                : formatPrice(shippingCents)}
            </span>
          </div>
          {method === "COD" && shippingCents > 0 && (
            <p className="text-xs text-ink-soft">
              Tip: pay online (card, PayFast or bank transfer) and shipping is free.
            </p>
          )}
          <div className="flex justify-between border-t border-parchment pt-2 text-base font-medium">
            <span>Total</span>
            <span>{formatPrice(totalCents)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
