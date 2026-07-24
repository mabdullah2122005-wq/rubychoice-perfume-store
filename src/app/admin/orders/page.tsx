import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { formatPrice, formatDate, formatOrderNumber } from "@/lib/format";
import OrderManager from "@/components/admin/OrderManager";

// Filter tabs. "Needs action" = the queue an owner works through daily.
const NEEDS_ACTION = ["PENDING", "CONFIRMED", "PAID"];
const tabs = [
  { key: "action", label: "Needs action" },
  { key: "all", label: "All" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "PAID", label: "Paid" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "PENDING", label: "Pending" },
  { key: "CANCELLED", label: "Cancelled" },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filter = typeof params.status === "string" ? params.status : "action";

  const where: Prisma.OrderWhereInput =
    filter === "all"
      ? {}
      : filter === "action"
        ? { status: { in: NEEDS_ACTION } }
        : { status: filter };

  const [orders, counts] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { items: true },
      take: 100,
    }),
    db.order.groupBy({ by: ["status"], _count: true }),
  ]);

  const countFor = (key: string) => {
    if (key === "all") return counts.reduce((s, c) => s + c._count, 0);
    if (key === "action")
      return counts.filter((c) => NEEDS_ACTION.includes(c.status)).reduce((s, c) => s + c._count, 0);
    return counts.find((c) => c.status === key)?._count ?? 0;
  };

  return (
    <div>
      <h2 className="mb-4 font-serif text-2xl">Orders</h2>

      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = filter === tab.key;
          const count = countFor(tab.key);
          return (
            <Link
              key={tab.key}
              href={tab.key === "action" ? "/admin/orders" : `/admin/orders?status=${tab.key}`}
              className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-wide transition ${
                active
                  ? "border-ink bg-ink text-cream"
                  : "border-parchment text-ink-soft hover:border-ink/40 hover:text-ink"
              }`}
            >
              {tab.label}
              <span className={active ? "ml-1.5 text-cream/70" : "ml-1.5 text-ink-soft/60"}>
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-ink-soft">No orders in this view.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <details key={order.id} className="card-panel overflow-hidden">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-4">
                <span className="font-mono text-sm font-medium">{formatOrderNumber(order.orderNumber)}</span>
                <span className="text-sm text-ink-soft">{formatDate(order.createdAt)}</span>
                <span className="text-xs uppercase tracking-wide text-gold-dark">{order.paymentMethod}</span>
                <span className="text-sm">{order.email}</span>
                <span className="text-sm font-medium">{formatPrice(order.totalCents)}</span>
                <OrderManager
                  orderId={order.id}
                  status={order.status}
                  courierName={order.courierName}
                  trackingNumber={order.trackingNumber}
                />
              </summary>
              <div className="border-t border-parchment p-4 text-sm">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-widest text-ink-soft">Items</p>
                    <ul className="space-y-1">
                      {order.items.map((item) => (
                        <li key={item.id}>
                          {item.name} × {item.quantity} —{" "}
                          {formatPrice(item.priceCents * item.quantity)}
                        </li>
                      ))}
                      {order.shippingCents > 0 && (
                        <li className="text-ink-soft">
                          Shipping — {formatPrice(order.shippingCents)}
                        </li>
                      )}
                      {order.discountCents > 0 && (
                        <li className="text-ink-soft">
                          Discount ({order.couponCode}) — −{formatPrice(order.discountCents)}
                        </li>
                      )}
                    </ul>
                    {order.courierName && (
                      <p className="mt-3 text-xs text-ink-soft">
                        Shipped via <span className="text-ink">{order.courierName}</span>
                        {order.trackingNumber ? ` · ${order.trackingNumber}` : ""}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-widest text-ink-soft">Ship to</p>
                    <p>{order.shippingName}</p>
                    {order.phone && <p className="font-medium">📞 {order.phone}</p>}
                    <p>{order.addressLine1}</p>
                    {order.addressLine2 && <p>{order.addressLine2}</p>}
                    <p>
                      {order.city}
                      {order.province ? `, ${order.province}` : ""} {order.postalCode}
                    </p>
                    <p>{order.country}</p>
                    <p className="mt-2 text-xs text-ink-soft">
                      Payment: {order.paymentMethod} · Internal id {order.id}
                    </p>
                  </div>
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
