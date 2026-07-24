"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CouponActions({
  couponId,
  code,
  active,
}: {
  couponId: string;
  code: string;
  active: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/coupons/${couponId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete the code ${code}? Existing orders keep their discount.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/coupons/${couponId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-4">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className="text-xs uppercase tracking-widest text-gold-dark hover:underline disabled:opacity-50"
      >
        {active ? "Deactivate" : "Activate"}
      </button>
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="text-xs uppercase tracking-widest text-wine hover:underline disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
