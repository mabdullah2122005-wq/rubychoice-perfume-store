import { db } from "@/lib/db";
import { formatPrice, formatDate } from "@/lib/format";
import CouponForm from "@/components/admin/CouponForm";
import CouponActions from "@/components/admin/CouponActions";

export const metadata = { title: "Coupons — Admin" };

export default async function AdminCouponsPage() {
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-10">
      <div>
        <h2 className="mb-6 font-serif text-2xl">Discount codes ({coupons.length})</h2>
        {coupons.length === 0 ? (
          <p className="text-sm text-ink-soft">
            No codes yet — create one below and share it in your WhatsApp status
            or newsletter.
          </p>
        ) : (
          <div className="card-panel overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-parchment text-left text-xs uppercase tracking-widest text-ink-soft">
                  <th className="p-3">Code</th>
                  <th className="p-3">Discount</th>
                  <th className="p-3">Min order</th>
                  <th className="p-3">Used</th>
                  <th className="p-3">Expires</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => {
                  const expired = c.expiresAt !== null && c.expiresAt.getTime() < Date.now();
                  const exhausted = c.maxUses !== null && c.usedCount >= c.maxUses;
                  return (
                    <tr key={c.id} className="border-b border-parchment/60">
                      <td className="p-3 font-mono font-medium">{c.code}</td>
                      <td className="p-3">
                        {c.kind === "PERCENT" ? `${c.value}% off` : `${formatPrice(c.value)} off`}
                      </td>
                      <td className="p-3">
                        {c.minSubtotalCents > 0 ? formatPrice(c.minSubtotalCents) : "—"}
                      </td>
                      <td className="p-3">
                        {c.usedCount}
                        {c.maxUses !== null ? ` / ${c.maxUses}` : ""}
                      </td>
                      <td className="p-3">{c.expiresAt ? formatDate(c.expiresAt) : "Never"}</td>
                      <td className={`p-3 text-xs uppercase tracking-wide ${!c.active || expired || exhausted ? "text-wine" : ""}`}>
                        {!c.active ? "Off" : expired ? "Expired" : exhausted ? "Used up" : "Live"}
                      </td>
                      <td className="p-3">
                        <CouponActions couponId={c.id} code={c.code} active={c.active} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CouponForm />
    </div>
  );
}
