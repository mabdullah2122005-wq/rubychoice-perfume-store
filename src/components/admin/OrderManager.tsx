"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { site } from "@/lib/site";

export default function OrderManager({
  orderId,
  status,
  courierName,
  trackingNumber,
}: {
  orderId: string;
  status: string;
  courierName: string | null;
  trackingNumber: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  // When the admin picks SHIPPED we collect courier details before sending,
  // so the shipment email carries a tracking number.
  const [shipDraft, setShipDraft] = useState<null | { courier: string; tracking: string }>(null);

  async function patch(payload: Record<string, string>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShipDraft(null);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  function onSelect(next: string) {
    if (next === status) return;
    if (next === "SHIPPED") {
      setShipDraft({ courier: courierName ?? "TCS", tracking: trackingNumber ?? "" });
      return;
    }
    patch({ status: next });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <select
        value={status}
        disabled={busy}
        onChange={(e) => onSelect(e.target.value)}
        className="cursor-pointer rounded-lg border border-parchment bg-surface px-2 py-1 text-xs uppercase tracking-wide text-ink outline-none focus:border-gold disabled:opacity-50"
        aria-label="Order status"
      >
        {site.orderStatuses.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {shipDraft && (
        <div className="w-56 space-y-2 rounded-lg border border-gold/40 bg-gold/5 p-3 text-left">
          <p className="text-[10px] uppercase tracking-widest text-gold-dark">
            Shipment details
          </p>
          <input
            className="field !py-1.5 text-sm"
            placeholder="Courier (e.g. TCS)"
            maxLength={60}
            value={shipDraft.courier}
            onChange={(e) => setShipDraft({ ...shipDraft, courier: e.target.value })}
          />
          <input
            className="field !py-1.5 text-sm"
            placeholder="Tracking number (optional)"
            maxLength={80}
            value={shipDraft.tracking}
            onChange={(e) => setShipDraft({ ...shipDraft, tracking: e.target.value })}
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                patch({
                  status: "SHIPPED",
                  courierName: shipDraft.courier,
                  trackingNumber: shipDraft.tracking,
                })
              }
              className="btn-primary flex-1 !px-3 !py-1.5 text-[11px]"
            >
              {busy ? "…" : "Ship & email"}
            </button>
            <button
              type="button"
              onClick={() => setShipDraft(null)}
              className="btn-outline !px-3 !py-1.5 text-[11px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
