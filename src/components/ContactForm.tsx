"use client";

import { useState } from "react";

const inputClass = "field";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  function set(field: keyof typeof form) {
    return (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setState("error");
        setError(data.error ?? "Could not send your message.");
        return;
      }
      setState("done");
    } catch {
      setState("error");
      setError("Network error — please try again.");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-gold/40 bg-gold/10 p-6 text-center">
        <p className="font-serif text-2xl">Message received</p>
        <p className="mt-2 text-sm text-ink-soft">
          We reply within one business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input type="text" required minLength={2} maxLength={60} placeholder="Name" value={form.name} onChange={set("name")} className={inputClass} autoComplete="name" />
        <input type="email" required maxLength={254} placeholder="Email" value={form.email} onChange={set("email")} className={inputClass} autoComplete="email" />
      </div>
      <input type="text" required minLength={3} maxLength={120} placeholder="Subject" value={form.subject} onChange={set("subject")} className={inputClass} />
      <textarea required minLength={10} maxLength={2000} rows={6} placeholder="Your message" value={form.message} onChange={set("message")} className={inputClass} />
      {error && <p className="text-sm text-wine" role="alert">{error}</p>}
      <button type="submit" disabled={state === "loading"} className="btn-primary">
        {state === "loading" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
