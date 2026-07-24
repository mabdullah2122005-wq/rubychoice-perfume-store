"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState("error");
        setMessage(data.error ?? "Something went wrong.");
        return;
      }
      setState("done");
      setMessage("Welcome to the maison. Check your inbox soon.");
      setEmail("");
    } catch {
      setState("error");
      setMessage("Network error — please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm gap-2">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        maxLength={254}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        className="field"
      />
      <button
        type="submit"
        disabled={state === "loading"}
        className="whitespace-nowrap rounded-xl bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-widest text-cream transition hover:bg-gold-dark disabled:opacity-50"
      >
        {state === "loading" ? "…" : "Subscribe"}
      </button>
      {message && (
        <p
          className={`absolute mt-12 text-xs ${state === "error" ? "text-wine" : "text-gold"}`}
          role="status"
        >
          {message}
        </p>
      )}
    </form>
  );
}
