import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice, formatDate } from "@/lib/format";

export default async function AdminDashboard() {
  const [productCount, orderCount, paidAgg, subscriberCount, recentOrders, messages] =
    await Promise.all([
      db.product.count(),
      db.order.count(),
      db.order.aggregate({
        _sum: { totalCents: true },
        where: { status: { in: ["PAID", "SHIPPED", "DELIVERED"] } },
      }),
      db.newsletterSubscriber.count(),
      db.order.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    ]);

  const stats = [
    { label: "Revenue (paid)", value: formatPrice(paidAgg._sum.totalCents ?? 0) },
    { label: "Orders", value: String(orderCount) },
    { label: "Products", value: String(productCount) },
    { label: "Subscribers", value: String(subscriberCount) },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card-panel p-5">
            <p className="text-xs uppercase tracking-widest text-ink-soft">{s.label}</p>
            <p className="mt-2 font-serif text-3xl">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl">Latest orders</h2>
            <Link href="/admin/orders" className="text-sm text-gold-dark underline">All orders →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">No orders yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-parchment border-y border-parchment text-sm">
              {recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2.5">
                  <span className="font-mono text-xs">{o.id.slice(0, 10)}…</span>
                  <span className="text-ink-soft">{formatDate(o.createdAt)}</span>
                  <span className="text-xs uppercase">{o.status}</span>
                  <span className="font-medium">{formatPrice(o.totalCents)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-serif text-2xl">Latest messages</h2>
          {messages.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">No messages yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {messages.map((m) => (
                <li key={m.id} className="card-panel p-3 text-sm">
                  <p className="font-medium">{m.subject}</p>
                  <p className="mt-1 line-clamp-2 text-ink-soft">{m.message}</p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {m.name} · {m.email} · {formatDate(m.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
