import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice, formatDate, formatOrderNumber } from "@/lib/format";
import SignOutButton from "@/components/SignOutButton";

export const metadata = { title: "My account" };

const statusStyles: Record<string, string> = {
  PENDING: "bg-parchment text-ink",
  CONFIRMED: "bg-gold/20 text-gold-dark",
  PAID: "bg-gold/20 text-gold-dark",
  SHIPPED: "bg-sage/30 text-ink",
  DELIVERED: "bg-sage/60 text-ink",
  CANCELLED: "bg-wine/10 text-wine",
};

const methodLabels: Record<string, string> = {
  COD: "Cash on Delivery",
  BANK: "Bank transfer",
  CARD: "Card",
};

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
    take: 20,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold-dark">My account</p>
          <h1 className="mt-1 font-serif text-4xl">Bonjour, {user.name}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {user.email} · member since {formatDate(user.createdAt)}
          </p>
        </div>
        <SignOutButton />
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link href="/favourites" className="btn-outline !px-5 !py-2">
          My favourites
        </Link>
        <Link href="/track" className="btn-outline !px-5 !py-2">
          Track an order
        </Link>
        <Link href="/shop" className="btn-outline !px-5 !py-2">
          Continue shopping
        </Link>
      </div>

      <h2 className="mt-12 font-serif text-2xl">Order history</h2>
      {orders.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">No orders yet.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="card-panel p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-sm font-medium">{formatOrderNumber(order.orderNumber)}</p>
                  <p className="text-sm">
                    {formatDate(order.createdAt)} ·{" "}
                    <span className="text-ink-soft">{methodLabels[order.paymentMethod] ?? order.paymentMethod}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-1 text-[10px] uppercase tracking-widest ${statusStyles[order.status] ?? "bg-parchment"}`}
                  >
                    {order.status}
                  </span>
                  <span className="text-sm font-medium">{formatPrice(order.totalCents)}</span>
                </div>
              </div>
              <ul className="mt-3 space-y-1 border-t border-parchment pt-3 text-sm text-ink-soft">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.name} × {item.quantity} — {formatPrice(item.priceCents * item.quantity)}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
