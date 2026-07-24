"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not reset your password.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 2200);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="card-panel p-6 text-center">
        <p className="font-serif text-xl">Invalid link</p>
        <p className="mt-2 text-sm text-ink-soft">
          This reset link is missing its token. Please request a new one.
        </p>
        <Link href="/forgot" className="btn-primary mt-6">
          Request a reset link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="card-panel p-6 text-center">
        <p className="font-serif text-xl">Password updated ✓</p>
        <p className="mt-2 text-sm text-ink-soft">
          You can now sign in with your new password. Redirecting…
        </p>
        <Link href="/login" className="btn-primary mt-6">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="rp-pass" className="mb-1 block text-xs uppercase tracking-widest text-ink-soft">
          New password
        </label>
        <input
          id="rp-pass"
          type="password"
          required
          minLength={10}
          maxLength={72}
          autoComplete="new-password"
          className="field"
          placeholder="At least 10 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="rp-confirm" className="mb-1 block text-xs uppercase tracking-widest text-ink-soft">
          Confirm new password
        </label>
        <input
          id="rp-confirm"
          type="password"
          required
          minLength={10}
          maxLength={72}
          autoComplete="new-password"
          className="field"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      {error && (
        <p className="border border-wine/40 bg-wine/5 px-3 py-2 text-sm text-wine" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
