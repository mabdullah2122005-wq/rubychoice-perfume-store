"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import StarRating from "./StarRating";

type Existing = { rating: number; title: string; body: string } | null;

export default function ReviewForm({
  slug,
  loggedIn,
  existing,
}: {
  slug: string;
  loggedIn: boolean;
  existing: Existing;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(existing?.rating ?? 5);
  const [name, setName] = useState("");
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/products/${slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          title,
          body,
          ...(loggedIn ? {} : { name }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save your review.");
        return;
      }
      setDone(true);
      if (!loggedIn) {
        setName("");
        setTitle("");
        setBody("");
        setRating(5);
      }
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <p className="font-serif text-lg">
        {existing ? "Update your review" : "Write a review"}
      </p>
      {!loggedIn && (
        <p className="text-xs text-ink-soft">
          No account needed — just add your name. Have one?{" "}
          <a href={`/login?next=/product/${slug}`} className="text-gold-dark underline">
            Sign in
          </a>{" "}
          to keep all your reviews together.
        </p>
      )}
      <StarRating value={rating} onChange={setRating} size={22} />
      {!loggedIn && (
        <input
          type="text"
          required
          minLength={2}
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="field"
          autoComplete="name"
        />
      )}
      <input
        type="text"
        required
        minLength={3}
        maxLength={80}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="field"
      />
      <textarea
        required
        minLength={10}
        maxLength={1000}
        rows={4}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="How does it wear? What does it evoke?"
        className="field"
      />
      {error && <p className="text-sm text-wine" role="alert">{error}</p>}
      {done && <p className="text-sm text-gold-dark" role="status">Thank you — your review is live.</p>}
      <button type="submit" disabled={busy} className="btn-primary !px-6 !py-2.5">
        {busy ? "Saving…" : existing ? "Update review" : "Publish review"}
      </button>
    </form>
  );
}
