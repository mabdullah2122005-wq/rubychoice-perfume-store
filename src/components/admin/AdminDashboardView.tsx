import Link from "next/link";
import type { DashboardData } from "@/lib/admin-dashboard";
import { formatPrice, formatDate, formatOrderNumber } from "@/lib/format";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-900",
  CONFIRMED: "bg-blue-100 text-blue-900",
  PAID: "bg-emerald-100 text-emerald-900",
  SHIPPED: "bg-violet-100 text-violet-900",
  DELIVERED: "bg-ink/10 text-ink",
  CANCELLED: "bg-wine/10 text-wine",
};

function TrendBadge({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  const up = pct >= 0;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
        up ? "bg-emerald-100 text-emerald-800" : "bg-wine/10 text-wine"
      }`}
    >
      {up ? "↑" : "↓"} {Math.abs(pct)}% vs prior
    </span>
  );
}

function StatCard({
  label,
  value,
  hint,
  trend,
  href,
  alert,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: number | null;
  href?: string;
  alert?: boolean;
}) {
  const inner = (
    <div
      className={`card-panel p-5 transition ${href ? "hover:border-ink/30 hover:shadow-sm" : ""} ${
        alert ? "border-wine/40 bg-wine/[0.03]" : ""
      }`}
    >
      <p className="text-xs uppercase tracking-widest text-ink-soft">{label}</p>
      <p className="mt-2 font-serif text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
      {trend !== undefined && (
        <div className="mt-2">
          <TrendBadge pct={trend} />
        </div>
      )}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
        STATUS_COLORS[status] ?? "bg-cream-dark text-ink-soft"
      }`}
    >
      {status}
    </span>
  );
}

export default function AdminDashboardView({ data }: { data: DashboardData }) {
  const maxDaily = Math.max(...data.dailyRevenue.map((d) => d.cents), 1);
  const maxPipeline = Math.max(...data.orders.byStatus.map((s) => s.count), 1);
  const totalPaymentRevenue = data.paymentMix.reduce((s, p) => s + p.revenueCents, 0);

  return (
    <div className="space-y-8">
      {/* Store status + quick actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {data.storeClosed ? (
          <div className="flex items-center gap-3 rounded-xl border border-wine/30 bg-wine/5 px-4 py-3 text-sm">
            <span className="h-2 w-2 shrink-0 rounded-full bg-wine" />
            <span>
              Storefront is <strong>not live</strong> ({data.settings.mode.replace("_", " ").toLowerCase()}).
              Visitors see the cover page.
            </span>
            <Link href="/admin/settings" className="ml-auto shrink-0 text-xs uppercase tracking-widest text-wine underline">
              Settings
            </Link>
          </div>
        ) : data.settings.announcement ? (
          <div className="flex items-center gap-3 rounded-xl border border-parchment bg-cream-dark px-4 py-3 text-sm">
            <span className="text-xs uppercase tracking-widest text-ink-soft">Announcement live</span>
            <span className="line-clamp-1 text-ink-soft">{data.settings.announcement}</span>
          </div>
        ) : (
          <p className="text-sm text-ink-soft">Store is live and accepting orders.</p>
        )}

        <div className="flex flex-wrap gap-2">
          <Link href="/admin/orders" className="btn-outline !px-4 !py-2 text-[10px]">
            Orders{data.orders.needsAction > 0 ? ` (${data.orders.needsAction})` : ""}
          </Link>
          <Link href="/admin/products/new" className="btn-outline !px-4 !py-2 text-[10px]">
            + Product
          </Link>
          <Link href="/admin/coupons" className="btn-outline !px-4 !py-2 text-[10px]">
            Coupons
          </Link>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Revenue (paid)"
          value={formatPrice(data.revenue.allTimeCents)}
          hint={`${formatPrice(data.revenue.thisMonthCents)} this month`}
          trend={data.revenue.monthChangePct}
        />
        <StatCard
          label="Orders"
          value={String(data.orders.total)}
          hint={`${data.orders.thisWeek} this week`}
          trend={data.orders.weekChangePct}
          href="/admin/orders"
        />
        <StatCard
          label="Needs action"
          value={String(data.orders.needsAction)}
          hint="Pending · confirmed · paid"
          href="/admin/orders"
          alert={data.orders.needsAction > 0}
        />
        <StatCard
          label="Avg order value"
          value={formatPrice(data.revenue.avgOrderCents)}
          hint="Paid orders only"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          {
            label: "Products",
            value: String(data.catalog.published),
            hint: `${data.catalog.total} total · ${data.catalog.lowStock} low`,
            href: "/admin/products",
          },
          {
            label: "Customers",
            value: String(data.customers.total),
            hint: `+${data.customers.newThisMonth} this month`,
          },
          {
            label: "Subscribers",
            value: String(data.engagement.subscribers),
            hint: "Newsletter",
          },
          {
            label: "Reviews",
            value: String(data.engagement.reviews),
            hint: "All time",
          },
          {
            label: "Coupons",
            value: String(data.coupons.active),
            hint: `${data.coupons.total} total`,
            href: "/admin/coupons",
          },
          {
            label: "Messages",
            value: String(data.engagement.messagesThisWeek),
            hint: `${data.engagement.messagesTotal} all time`,
          },
        ].map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} hint={s.hint} href={s.href} />
        ))}
      </div>

      {/* Order pipeline */}
      {data.orders.byStatus.length > 0 && (
        <section className="card-panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl">Order pipeline</h2>
            <Link href="/admin/orders" className="text-xs uppercase tracking-widest text-gold-dark underline">
              Manage orders
            </Link>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-cream-dark">
            {data.orders.byStatus.map((s) => (
              <div
                key={s.status}
                className={`h-full ${STATUS_COLORS[s.status]?.split(" ")[0] ?? "bg-parchment"}`}
                style={{ width: `${(s.count / data.orders.total) * 100}%` }}
                title={`${s.status}: ${s.count}`}
              />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {data.orders.byStatus.map((s) => (
              <div key={s.status} className="flex items-center gap-2 text-xs">
                <StatusBadge status={s.status} />
                <span className="font-medium">{s.count}</span>
                <span className="text-ink-soft">
                  ({Math.round((s.count / maxPipeline) * 100)}% of peak)
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card-panel p-5">
          <h2 className="font-serif text-xl">Revenue — last 7 days</h2>
          <p className="mt-1 text-xs text-ink-soft">Paid, shipped & delivered orders</p>
          <div className="mt-6 flex items-end justify-between gap-2" style={{ minHeight: "9rem" }}>
            {data.dailyRevenue.map((day) => {
              const height = day.cents > 0 ? Math.max(8, (day.cents / maxDaily) * 100) : 4;
              return (
                <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[10px] text-ink-soft">
                    {day.cents > 0 ? formatPrice(day.cents) : "—"}
                  </span>
                  <div
                    className="w-full max-w-10 rounded-t-md bg-ink/80 transition-all"
                    style={{ height: `${height}%`, minHeight: day.cents > 0 ? "1.5rem" : "0.25rem" }}
                    title={`${day.orders} order${day.orders === 1 ? "" : "s"}`}
                  />
                  <span className="text-[10px] uppercase tracking-wide text-ink-soft">{day.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card-panel p-5">
          <h2 className="font-serif text-xl">Payment mix</h2>
          <p className="mt-1 text-xs text-ink-soft">By paid-order revenue</p>
          {data.paymentMix.length === 0 ? (
            <p className="mt-6 text-sm text-ink-soft">No paid orders yet.</p>
          ) : (
            <ul className="mt-5 space-y-4">
              {data.paymentMix.map((p) => {
                const pct =
                  totalPaymentRevenue > 0
                    ? Math.round((p.revenueCents / totalPaymentRevenue) * 100)
                    : 0;
                return (
                  <li key={p.method}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium uppercase tracking-wide">{p.method}</span>
                      <span>
                        {formatPrice(p.revenueCents)}{" "}
                        <span className="text-ink-soft">({p.count})</span>
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-cream-dark">
                      <div className="h-full rounded-full bg-ink/70" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Data tables */}
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-xl">Recent orders</h2>
            <Link href="/admin/orders" className="text-xs uppercase tracking-widest text-gold-dark underline">
              All orders →
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="text-sm text-ink-soft">No orders yet.</p>
          ) : (
            <div className="card-panel overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-parchment text-left text-[10px] uppercase tracking-widest text-ink-soft">
                    <th className="p-3">Order</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((o) => (
                    <tr key={o.id} className="border-b border-parchment/60 last:border-0">
                      <td className="p-3">
                        <p className="font-mono text-xs font-medium">{formatOrderNumber(o.orderNumber)}</p>
                        <p className="mt-0.5 truncate text-[11px] text-ink-soft">{o.email}</p>
                      </td>
                      <td className="p-3 text-xs text-ink-soft">{formatDate(o.createdAt)}</td>
                      <td className="p-3">
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="p-3 text-right font-medium">{formatPrice(o.totalCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-xl">Top sellers</h2>
            <Link href="/admin/products" className="text-xs uppercase tracking-widest text-gold-dark underline">
              Products →
            </Link>
          </div>
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-ink-soft">No sales data yet.</p>
          ) : (
            <div className="card-panel overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-parchment text-left text-[10px] uppercase tracking-widest text-ink-soft">
                    <th className="p-3">Product</th>
                    <th className="p-3 text-right">Sold</th>
                    <th className="p-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.map((p) => (
                    <tr key={p.productId} className="border-b border-parchment/60 last:border-0">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <span className="block h-10 w-8 shrink-0 overflow-hidden bg-cream-dark">
                            <img src={p.image} alt="" className="h-full w-full object-cover" />
                          </span>
                          <Link
                            href={`/admin/products/${p.productId}/edit`}
                            className="font-medium hover:underline"
                          >
                            {p.name}
                          </Link>
                        </div>
                      </td>
                      <td className="p-3 text-right">{p.unitsSold}</td>
                      <td className="p-3 text-right font-medium">{formatPrice(p.revenueCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Alerts + messages */}
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-xl">
              Inventory alerts
              {data.catalog.lowStock > 0 && (
                <span className="ml-2 text-sm font-sans text-wine">({data.catalog.lowStock})</span>
              )}
            </h2>
            <Link href="/admin/products" className="text-xs uppercase tracking-widest text-gold-dark underline">
              Products →
            </Link>
          </div>
          {data.catalog.lowStockProducts.length === 0 ? (
            <p className="text-sm text-ink-soft">All published products are well stocked.</p>
          ) : (
            <ul className="space-y-2">
              {data.catalog.lowStockProducts.map((p) => (
                <li key={p.id} className="card-panel flex items-center justify-between p-3 text-sm">
                  <Link href={`/admin/products/${p.id}/edit`} className="font-medium hover:underline">
                    {p.name}
                  </Link>
                  <span className={p.stock === 0 ? "font-medium text-wine" : "text-ink-soft"}>
                    {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {data.engagement.stockAlerts > 0 && (
            <p className="mt-3 text-xs text-ink-soft">
              {data.engagement.stockAlerts} customer{data.engagement.stockAlerts === 1 ? "" : "s"} waiting
              for back-in-stock notifications.
            </p>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-serif text-xl">Latest messages</h2>
          {data.recentMessages.length === 0 ? (
            <p className="text-sm text-ink-soft">No contact messages yet.</p>
          ) : (
            <ul className="space-y-3">
              {data.recentMessages.map((m) => (
                <li key={m.id} className="card-panel p-4 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{m.subject}</p>
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-ink-soft">
                      {formatDate(m.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-ink-soft">{m.message}</p>
                  <p className="mt-2 text-xs text-ink-soft">
                    {m.name} ·{" "}
                    <a href={`mailto:${m.email}`} className="underline hover:text-ink">
                      {m.email}
                    </a>
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
