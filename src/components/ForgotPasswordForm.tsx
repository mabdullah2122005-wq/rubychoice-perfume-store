"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong — please try again.");
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
      <div className="card-panel p-6 text-center">
        <p className="font-serif text-xl">Check your inbox</p>
        <p className="mt-2 text-sm text-ink-soft">
          If an account exists for <span className="font-medium text-ink">{email}</span>,
          a password-reset link is on its way. It expires in 1 hour.
        </p>
        <Link href="/login" className="btn-outline mt-6">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="fp-email" className="mb-1 block text-xs uppercase tracking-widest text-ink-soft">
          Email address
        </label>
        <input
          id="fp-email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          className="field"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {error && (
        <p className="border border-wine/40 bg-wine/5 px-3 py-2 text-sm text-wine" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? "Sending…" : "Send reset link"}
      </button>
      <p className="text-center text-sm text-ink-soft">
        Remembered it?{" "}
        <Link href="/login" className="text-gold-dark underline hover:no-underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
