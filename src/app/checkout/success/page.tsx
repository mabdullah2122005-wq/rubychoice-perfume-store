import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { formatPrice, formatOrderNumber, estimatedDelivery } from "@/lib/format";
import { site } from "@/lib/site";
import ClearCartOnSuccess from "@/components/ClearCartOnSuccess";

function mask(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "your email";
  return `${local.slice(0, 2)}•••@${domain}`;
}

export const metadata = { title: "Order confirmed" };

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const sessionId = typeof params.session_id === "string" ? params.session_id : null;
  const orderId = typeof params.order === "string" ? params.order : null;

  // Orders are looked up only by unguessable identifiers (cuid / Stripe
  // session id) and only non-sensitive fields are shown.
  const order = sessionId
    ? await db.order.findUnique({
        where: { stripeSessionId: sessionId },
        include: { items: true },
      })
    : orderId
      ? await db.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        })
      : null;

  const isCod = order?.paymentMethod === "COD";
  const isBank = order?.paymentMethod === "BANK";

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <ClearCartOnSuccess />
      <p className="text-xs uppercase tracking-[0.3em] text-gold-dark">Shukriya · Merci</p>
      <h1 className="mt-3 font-serif text-5xl">
        {isBank ? "Order received" : "Order confirmed"}
      </h1>

      {order ? (
        <>
          <p className="mt-4 text-ink-soft">
            A confirmation email is on its way to {mask(order.email)} — we&apos;ll
            email you again when it ships.
          </p>
          <div className="mx-auto mt-5 flex max-w-md flex-wrap items-stretch justify-center gap-3 text-left text-sm">
            <div className="flex-1 rounded-2xl border border-parchment bg-surface px-4 py-3">
              <p className="text-xs uppercase tracking-widest text-ink-soft">Order number</p>
              <p className="mt-0.5 font-mono text-lg font-medium">
                {formatOrderNumber(order.orderNumber)}
              </p>
            </div>
            {order.status !== "CANCELLED" && (
              <div className="flex-1 rounded-2xl border border-parchment bg-surface px-4 py-3">
                <p className="text-xs uppercase tracking-widest text-ink-soft">Est. delivery</p>
                <p className="mt-0.5 text-lg font-medium">{estimatedDelivery(order.createdAt)}</p>
              </div>
            )}
          </div>
          <p className="mt-3 text-xs text-ink-soft">
            Save your order number — you can{" "}
            <Link href="/track" className="text-gold-dark underline">track your order</Link>{" "}
            with it any time.
          </p>

          {isCod && (
            <div className="mx-auto mt-6 max-w-md rounded-2xl border border-gold/40 bg-gold/10 p-4 text-sm">
              <p className="font-medium">Cash on Delivery</p>
              <p className="mt-1 text-ink-soft">
                Keep <span className="font-medium text-ink">{formatPrice(order.totalCents)}</span> ready
                for the rider. Our courier will call {order.phone ? `you at ${order.phone}` : "you"} before
                delivery. {site.deliveryNote}.
              </p>
            </div>
          )}

          {isBank && (
            <div className="mx-auto mt-6 max-w-md rounded-2xl border border-gold/40 bg-gold/10 p-4 text-left text-sm">
              <p className="text-center font-medium">Bank transfer details</p>
              <dl className="mt-3 space-y-1.5">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-soft">Amount</dt>
                  <dd className="font-medium">{formatPrice(order.totalCents)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-soft">Account title</dt>
                  <dd>{site.bank.title}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-soft">Bank</dt>
                  <dd>{site.bank.bank}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-soft">IBAN</dt>
                  <dd className="font-mono text-xs">{site.bank.iban}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-soft">Reference</dt>
                  <dd className="font-mono text-xs">{formatOrderNumber(order.orderNumber)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-ink-soft">
                Please send your payment screenshot to WhatsApp{" "}
                <a
                  href={`https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(`Payment for order ${formatOrderNumber(order.orderNumber)}`)}`}
                  className="text-gold-dark underline"
                >
                  {site.whatsapp.display}
                </a>{" "}
                with the reference above. We ship as soon as the transfer clears.
              </p>
            </div>
          )}

          <ul className="mx-auto mt-8 max-w-md divide-y divide-parchment border-y border-parchment text-left">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3 text-sm">
                <span className="relative block h-12 w-10 shrink-0 overflow-hidden bg-cream-dark">
                  <Image src={item.image} alt="" fill sizes="40px" className="object-cover" />
                </span>
                <span className="flex-1">
                  {item.name} <span className="text-ink-soft">× {item.quantity}</span>
                </span>
                <span>{formatPrice(item.priceCents * item.quantity)}</span>
              </li>
            ))}
            {order.shippingCents > 0 && (
              <li className="flex justify-between py-3 text-sm text-ink-soft">
                <span>Shipping</span>
                <span>{formatPrice(order.shippingCents)}</span>
              </li>
            )}
            {order.discountCents > 0 && (
              <li className="flex justify-between py-3 text-sm text-ink-soft">
                <span>Discount ({order.couponCode})</span>
                <span>−{formatPrice(order.discountCents)}</span>
              </li>
            )}
            <li className="flex justify-between py-3 text-sm font-medium">
              <span>Total</span>
              <span>{formatPrice(order.totalCents)}</span>
            </li>
          </ul>
          {order.status === "PENDING" && !isBank && (
            <p className="mt-4 text-xs text-ink-soft">
              Payment is being confirmed — the order will update shortly.
            </p>
          )}
        </>
      ) : (
        <p className="mt-4 text-ink-soft">
          Thank you for your purchase. A confirmation email is on its way.
        </p>
      )}

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="btn-primary">
          Continue shopping
        </Link>
        <Link href="/account" className="btn-outline">
          View my orders
        </Link>
      </div>
    </div>
  );
}
