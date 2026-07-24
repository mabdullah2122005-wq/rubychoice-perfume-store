"use client";

import { useState } from "react";

export default function BackInStockForm({ slug }: { slug: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/products/${slug}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not register — please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mt-3 rounded-2xl border border-parchment bg-cream-dark p-4 text-sm">
        ✓ We&apos;ll email you the moment it&apos;s back in stock.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 rounded-2xl border border-parchment bg-cream-dark p-4">
      <p className="text-sm font-medium">Notify me when it&apos;s back</p>
      <p className="mt-0.5 text-xs text-ink-soft">
        Our batches are small — leave your email and we&apos;ll tell you the moment
        it returns.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          className="field flex-1"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email address for stock notification"
        />
        <button type="submit" disabled={busy} className="btn-primary !px-5">
          {busy ? "…" : "Notify me"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-wine" role="alert">{error}</p>}
    </form>
  );
}
