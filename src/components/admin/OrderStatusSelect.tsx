"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { site } from "@/lib/site";

export default function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function change(next: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <select
      value={status}
      disabled={busy}
      onChange={(e) => change(e.target.value)}
      className="cursor-pointer rounded-lg border border-parchment bg-surface px-2 py-1 text-xs uppercase tracking-wide text-ink outline-none focus:border-gold disabled:opacity-50"
      aria-label="Order status"
    >
      {site.orderStatuses.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}
