"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const inputClass = "field";

/** Only allow same-site relative paths as post-login destinations. */
function safeNext(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\")) {
    return raw;
  }
  return "/account";
}

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const params = useSearchParams();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "register"
            ? form
            : { email: form.email, password: form.password }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      // Full navigation so the server re-renders with the session cookie.
      window.location.assign(safeNext(params.get("next")));
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "register" && (
        <div>
          <label htmlFor="auth-name" className="mb-1 block text-xs uppercase tracking-widest text-ink-soft">
            Name
          </label>
          <input
            id="auth-name"
            type="text"
            required
            minLength={2}
            maxLength={60}
            autoComplete="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={inputClass}
          />
        </div>
      )}
      <div>
        <label htmlFor="auth-email" className="mb-1 block text-xs uppercase tracking-widest text-ink-soft">
          Email
        </label>
        <input
          id="auth-email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="auth-password" className="mb-1 block text-xs uppercase tracking-widest text-ink-soft">
          Password
        </label>
        <input
          id="auth-password"
          type="password"
          required
          minLength={mode === "register" ? 10 : 1}
          maxLength={72}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          className={inputClass}
        />
        {mode === "register" && (
          <p className="mt-1 text-xs text-ink-soft">At least 10 characters.</p>
        )}
        {mode === "login" && (
          <p className="mt-1.5 text-right text-xs">
            <Link href="/forgot" className="text-ink-soft underline hover:text-ink">
              Forgot password?
            </Link>
          </p>
        )}
      </div>

      {error && (
        <p className="border border-wine/40 bg-wine/5 px-3 py-2 text-sm text-wine" role="alert">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? "One moment…" : mode === "login" ? "Sign in" : "Create account"}
      </button>

      <p className="text-center text-sm text-ink-soft">
        {mode === "login" ? (
          <>
            New to the maison?{" "}
            <Link href={`/register?next=${encodeURIComponent(params.get("next") ?? "/account")}`} className="text-gold-dark underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href={`/login?next=${encodeURIComponent(params.get("next") ?? "/account")}`} className="text-gold-dark underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
