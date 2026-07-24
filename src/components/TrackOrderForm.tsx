"use client";

import { useState } from "react";
import { formatPrice, formatDate, formatOrderNumber, estimatedDelivery } from "@/lib/format";

type TrackedOrder = {
  id: string;
  orderNumber: number;
  status: string;
  paymentMethod: string;
  totalCents: number;
  createdAt: string;
  city: string;
  courierName: string | null;
  trackingNumber: string | null;
  items: { name: string; quantity: number }[];
};

const steps = ["Order placed", "Confirmed", "Shipped", "Delivered"];

function stepOf(status: string): number {
  switch (status) {
    case "PENDING":
      return 0;
    case "CONFIRMED":
    case "PAID":
      return 1;
    case "SHIPPED":
      return 2;
    case "DELIVERED":
      return 3;
    default:
      return -1; // CANCELLED
  }
}

export default function TrackOrderForm() {
  const [orderNumber, setOrderNumber] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setOrder(null);
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: orderNumber.trim(), contact: contact.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not find that order.");
        return;
      }
      setOrder(data.order);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  const step = order ? stepOf(order.status) : -1;
  const cancelled = order?.status === "CANCELLED";

  return (
    <div>
      <form onSubmit={handleSubmit} className="card-panel space-y-4 p-5 sm:p-6">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-ink-soft" htmlFor="to-id">
            Order number
          </label>
          <input
            id="to-id"
            className="field font-mono"
            required
            minLength={1}
            maxLength={40}
            placeholder="e.g. RC-10042"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
          />
          <p className="mt-1 text-xs text-ink-soft">
            It's on your confirmation page and in every order email.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-ink-soft" htmlFor="to-contact">
            Email or mobile number used at checkout
          </label>
          <input
            id="to-contact"
            className="field"
            required
            minLength={5}
            maxLength={254}
            placeholder="you@example.com or 0300-1234567"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
        </div>
        {error && (
          <p className="border border-wine/40 bg-wine/5 px-3 py-2 text-sm text-wine" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "Looking up…" : "Track my order"}
        </button>
      </form>

      {order && (
        <div className="card-panel mt-6 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-sm font-medium">{formatOrderNumber(order.orderNumber)}</p>
            <p className="text-xs text-ink-soft">{formatDate(order.createdAt)}</p>
          </div>

          {cancelled ? (
            <p className="mt-4 border border-wine/40 bg-wine/5 px-3 py-2 text-sm text-wine">
              This order was cancelled. If that's unexpected, message us on
              WhatsApp and we'll sort it out.
            </p>
          ) : (
            <>
              <ol className="mt-6 flex items-start" aria-label="Order progress">
                {steps.map((label, i) => (
                  <li key={label} className="relative flex-1 text-center">
                    {i > 0 && (
                      <span
                        aria-hidden
                        className={`absolute right-1/2 top-[7px] h-0.5 w-full ${
                          i <= step ? "bg-ink" : "bg-parchment"
                        }`}
                      />
                    )}
                    <span
                      aria-hidden
                      className={`relative z-10 mx-auto block h-4 w-4 rounded-full border-2 ${
                        i <= step ? "border-ink bg-ink" : "border-parchment bg-surface"
                      }`}
                    />
                    <span
                      className={`mt-2 block text-[10px] uppercase tracking-wide sm:text-xs ${
                        i <= step ? "text-ink" : "text-ink-soft"
                      }`}
                    >
                      {label}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-5 text-center text-sm text-ink-soft">
                {order.status === "PENDING" &&
                  (order.paymentMethod === "BANK"
                    ? "Waiting for your bank transfer — we ship as soon as it clears."
                    : "Payment is being confirmed.")}
                {(order.status === "CONFIRMED" || order.status === "PAID") &&
                  "Confirmed — we're preparing your parcel."}
                {order.status === "SHIPPED" &&
                  "On its way! Our courier will call you before delivery."}
                {order.status === "DELIVERED" && "Delivered — enjoy!"}
              </p>
              {["CONFIRMED", "PAID", "SHIPPED"].includes(order.status) && (
                <p className="mt-2 text-center text-xs text-ink-soft">
                  Estimated delivery:{" "}
                  <span className="font-medium text-ink">{estimatedDelivery(order.createdAt)}</span>
                </p>
              )}

              {order.status === "SHIPPED" && order.courierName && (
                <div className="mt-4 rounded-xl border border-parchment bg-cream-dark px-4 py-3 text-center text-sm">
                  Shipped via <span className="font-medium">{order.courierName}</span>
                  {order.trackingNumber && (
                    <>
                      <br />
                      Tracking:{" "}
                      <span className="font-mono text-xs">{order.trackingNumber}</span>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          <ul className="mt-6 divide-y divide-parchment border-y border-parchment text-sm">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between py-2.5">
                <span>
                  {item.name} <span className="text-ink-soft">× {item.quantity}</span>
                </span>
              </li>
            ))}
            <li className="flex justify-between py-2.5 font-medium">
              <span>Total{order.paymentMethod === "COD" ? " (pay on delivery)" : ""}</span>
              <span>{formatPrice(order.totalCents)}</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
