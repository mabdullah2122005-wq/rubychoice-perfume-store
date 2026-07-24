"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const labelClass = "mb-1 block text-xs uppercase tracking-widest text-ink-soft";

export default function CouponForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    code: "",
    kind: "PERCENT",
    value: 10,
    minRupees: 0,
    maxUses: "",
    expiresAt: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          kind: form.kind,
          // Percent codes store the percentage; fixed codes store paisa.
          value: form.kind === "PERCENT" ? form.value : form.value * 100,
          minSubtotalCents: form.minRupees * 100,
          maxUses: form.maxUses === "" ? null : Number(form.maxUses),
          expiresAt: form.expiresAt === "" ? null : new Date(form.expiresAt).toISOString(),
          active: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create coupon.");
        return;
      }
      setForm({ code: "", kind: "PERCENT", value: 10, minRupees: 0, maxUses: "", expiresAt: "" });
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-panel space-y-4 p-5">
      <h3 className="font-serif text-xl">New discount code</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="cf-code">Code</label>
          <input
            id="cf-code"
            className="field uppercase"
            required
            pattern="[A-Za-z0-9_-]{3,40}"
            placeholder="EID25"
            value={form.code}
            onChange={(e) => set("code", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="cf-kind">Type</label>
          <select id="cf-kind" className="field" value={form.kind} onChange={(e) => set("kind", e.target.value)}>
            <option value="PERCENT">Percentage off</option>
            <option value="FIXED">Fixed amount off</option>
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="cf-value">
            {form.kind === "PERCENT" ? "Discount (%)" : "Discount (Rs)"}
          </label>
          <input
            id="cf-value"
            type="number"
            className="field"
            required
            min={1}
            max={form.kind === "PERCENT" ? 90 : 100000}
            value={form.value}
            onChange={(e) => set("value", Number(e.target.value))}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="cf-min">Minimum order (Rs, 0 = none)</label>
          <input
            id="cf-min"
            type="number"
            className="field"
            min={0}
            max={1000000}
            value={form.minRupees}
            onChange={(e) => set("minRupees", Number(e.target.value))}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="cf-max">Max uses (blank = unlimited)</label>
          <input
            id="cf-max"
            type="number"
            className="field"
            min={1}
            max={1000000}
            value={form.maxUses}
            onChange={(e) => set("maxUses", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="cf-expires">Expires (blank = never)</label>
          <input
            id="cf-expires"
            type="datetime-local"
            className="field"
            value={form.expiresAt}
            onChange={(e) => set("expiresAt", e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p className="border border-wine/40 bg-wine/5 px-3 py-2 text-sm text-wine" role="alert">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn-primary">
        {busy ? "Creating…" : "Create code"}
      </button>
    </form>
  );
}
