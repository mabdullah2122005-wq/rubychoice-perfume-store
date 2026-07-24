"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "LIVE" | "COMING_SOON" | "MAINTENANCE";

const modeOptions: { value: Mode; title: string; text: string }[] = [
  {
    value: "LIVE",
    title: "Live",
    text: "The store is open — visitors browse and order normally.",
  },
  {
    value: "COMING_SOON",
    title: "Launching soon",
    text: "Visitors see a branded cover page with a newsletter signup and optional countdown. If you set a launch time, the store opens automatically when it ends.",
  },
  {
    value: "MAINTENANCE",
    title: "Maintenance break",
    text: "Visitors see a short “back soon” page. Use for stock-taking or big changes. Orders are paused.",
  },
];

const labelClass = "mb-1 block text-xs uppercase tracking-widest text-ink-soft";

function toLocalInput(date: Date | null): string {
  if (!date) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
}

export default function SettingsForm({
  initial,
}: {
  initial: {
    mode: Mode;
    coverTitle: string;
    coverMessage: string;
    launchAt: string | null; // ISO
    announcement: string;
  };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    mode: initial.mode,
    coverTitle: initial.coverTitle,
    coverMessage: initial.coverMessage,
    launchAt: toLocalInput(initial.launchAt ? new Date(initial.launchAt) : null),
    announcement: initial.announcement,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: form.mode,
          coverTitle: form.coverTitle,
          coverMessage: form.coverMessage,
          launchAt: form.launchAt === "" ? null : new Date(form.launchAt).toISOString(),
          announcement: form.announcement,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save settings.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  const coverFieldsRelevant = form.mode !== "LIVE";

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
      <fieldset className="space-y-3">
        <legend className="mb-2 text-xs uppercase tracking-widest text-gold-dark">
          Storefront mode
        </legend>
        {modeOptions.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
              form.mode === option.value
                ? "border-gold bg-gold/10"
                : "border-parchment bg-surface hover:border-gold/50"
            }`}
          >
            <input
              type="radio"
              name="store-mode"
              value={option.value}
              checked={form.mode === option.value}
              onChange={() => set("mode", option.value)}
              className="mt-1 accent-black"
            />
            <span>
              <span className="block text-sm font-medium">{option.title}</span>
              <span className="mt-0.5 block text-xs text-ink-soft">{option.text}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className={`space-y-4 ${coverFieldsRelevant ? "" : "opacity-50"}`}>
        <legend className="mb-2 text-xs uppercase tracking-widest text-gold-dark">
          Cover page copy {coverFieldsRelevant ? "" : "(used when not Live)"}
        </legend>
        <div>
          <label className={labelClass} htmlFor="sf-title">
            Headline (blank = default)
          </label>
          <input
            id="sf-title"
            className="field"
            maxLength={120}
            placeholder={form.mode === "MAINTENANCE" ? "We'll be right back" : "Launching soon"}
            value={form.coverTitle}
            onChange={(e) => set("coverTitle", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="sf-message">
            Message (blank = default)
          </label>
          <textarea
            id="sf-message"
            className="field"
            rows={3}
            maxLength={1000}
            value={form.coverMessage}
            onChange={(e) => set("coverMessage", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="sf-launch">
            Launch countdown — store opens automatically at this time (blank = none)
          </label>
          <input
            id="sf-launch"
            type="datetime-local"
            className="field"
            value={form.launchAt}
            onChange={(e) => set("launchAt", e.target.value)}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-xs uppercase tracking-widest text-gold-dark">
          Announcement bar
        </legend>
        <label className={labelClass} htmlFor="sf-announcement">
          Text in the black bar at the top of every page (blank = default)
        </label>
        <input
          id="sf-announcement"
          className="field"
          maxLength={200}
          placeholder="Cash on Delivery nationwide · Free shipping over Rs 5,000"
          value={form.announcement}
          onChange={(e) => set("announcement", e.target.value)}
        />
        <p className="mt-2 text-xs text-ink-soft">
          Great for promos: “EID SALE — 15% off with code EID15 · Free shipping
          over Rs 5,000”.
        </p>
      </fieldset>

      {error && (
        <p className="border border-wine/40 bg-wine/5 px-3 py-2 text-sm text-wine" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? "Saving…" : "Save settings"}
        </button>
        {saved && <span className="text-sm text-ink-soft">Saved ✓ — changes are live immediately.</span>}
      </div>
    </form>
  );
}
