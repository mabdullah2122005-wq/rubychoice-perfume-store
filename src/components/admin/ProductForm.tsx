"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { site } from "@/lib/site";

export type ProductFormValues = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  productType: string;
  scentFamily: string;
  gender: string;
  notesTop: string;
  notesHeart: string;
  notesBase: string;
  priceCents: number;
  compareAtCents: number | null;
  sizeMl: number;
  sizes: { ml: number; priceCents: number }[];
  stock: number;
  image: string;
  featured: boolean;
  published: boolean;
};

const empty: ProductFormValues = {
  slug: "",
  name: "",
  tagline: "",
  description: "",
  productType: "Eau de Parfum",
  scentFamily: "Floral",
  gender: "Unisex",
  notesTop: "",
  notesHeart: "",
  notesBase: "",
  priceCents: 350000,
  compareAtCents: null,
  sizeMl: 30,
  sizes: [
    { ml: 5, priceCents: 100000 },
    { ml: 15, priceCents: 250000 },
    { ml: 50, priceCents: 550000 },
  ],
  stock: 20,
  image: "/products/photos/aurore.jpg",
  featured: false,
  published: true,
};

const inputClass = "field";
const labelClass = "mb-1 block text-xs uppercase tracking-widest text-ink-soft";

export default function ProductForm({
  productId,
  initial,
}: {
  productId?: string;
  initial?: ProductFormValues;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormValues>(initial ?? empty);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateSize(i: number, key: "ml" | "priceCents", value: number) {
    setForm((f) => ({
      ...f,
      sizes: f.sizes.map((s, idx) => (idx === i ? { ...s, [key]: value } : s)),
    }));
  }
  function addSize() {
    setForm((f) => ({ ...f, sizes: [...f.sizes, { ml: 10, priceCents: 200000 }] }));
  }
  function removeSize(i: number) {
    setForm((f) => ({ ...f, sizes: f.sizes.filter((_, idx) => idx !== i) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        productId ? `/api/admin/products/${productId}` : "/api/admin/products",
        {
          method: productId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Save failed.");
        return;
      }
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="pf-name">Name</label>
          <input id="pf-name" className={inputClass} required minLength={2} maxLength={80} value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="pf-slug">Slug (URL)</label>
          <input id="pf-slug" className={inputClass} required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} value={form.slug} onChange={(e) => set("slug", e.target.value)} />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="pf-tagline">Tagline</label>
        <input id="pf-tagline" className={inputClass} required minLength={2} maxLength={140} value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
      </div>

      <div>
        <label className={labelClass} htmlFor="pf-description">Description</label>
        <textarea id="pf-description" className={inputClass} required minLength={10} maxLength={4000} rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass} htmlFor="pf-type">Product type</label>
          <select id="pf-type" className={inputClass} value={form.productType} onChange={(e) => set("productType", e.target.value)}>
            {site.productTypes.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="pf-family">Scent family</label>
          <select id="pf-family" className={inputClass} value={form.scentFamily} onChange={(e) => set("scentFamily", e.target.value)}>
            {site.scentFamilies.map((f) => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="pf-gender">For</label>
          <select id="pf-gender" className={inputClass} value={form.gender} onChange={(e) => set("gender", e.target.value)}>
            {site.genders.map((g) => <option key={g}>{g}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="pf-image">Image path</label>
        <input id="pf-image" className={inputClass} required maxLength={300} value={form.image} onChange={(e) => set("image", e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass} htmlFor="pf-top">Top notes</label>
          <input id="pf-top" className={inputClass} required maxLength={200} value={form.notesTop} onChange={(e) => set("notesTop", e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="pf-heart">Heart notes</label>
          <input id="pf-heart" className={inputClass} required maxLength={200} value={form.notesHeart} onChange={(e) => set("notesHeart", e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="pf-base">Base notes</label>
          <input id="pf-base" className={inputClass} required maxLength={200} value={form.notesBase} onChange={(e) => set("notesBase", e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <label className={labelClass} htmlFor="pf-size">Default size (ml)</label>
          <input id="pf-size" type="number" className={inputClass} required min={1} max={1000} value={form.sizeMl} onChange={(e) => set("sizeMl", Number(e.target.value))} />
        </div>
        <div>
          <label className={labelClass} htmlFor="pf-price">Default price (cents)</label>
          <input id="pf-price" type="number" className={inputClass} required min={100} max={10000000} value={form.priceCents} onChange={(e) => set("priceCents", Number(e.target.value))} />
        </div>
        <div>
          <label className={labelClass} htmlFor="pf-compare">Compare-at (cents)</label>
          <input id="pf-compare" type="number" className={inputClass} min={100} max={10000000} value={form.compareAtCents ?? ""} onChange={(e) => set("compareAtCents", e.target.value ? Number(e.target.value) : null)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="pf-stock">Stock</label>
          <input id="pf-stock" type="number" className={inputClass} required min={0} max={1000000} value={form.stock} onChange={(e) => set("stock", Number(e.target.value))} />
        </div>
      </div>

      {/* Extra size options (the ml buttons customers pick from) */}
      <div className="rounded-2xl border border-parchment p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs uppercase tracking-widest text-ink-soft">
            Size options (ml buttons)
          </p>
          <button type="button" onClick={addSize} className="text-xs uppercase tracking-widest text-gold-dark hover:underline">
            + Add size
          </button>
        </div>
        <p className="mb-3 text-xs text-ink-soft">
          The default size above is always shown. Add other sizes customers can
          choose — each changes the price. Prices are in cents (Rs × 100).
        </p>
        {form.sizes.length === 0 ? (
          <p className="text-xs text-ink-soft">No extra sizes — only the default size is offered.</p>
        ) : (
          <div className="space-y-2">
            {form.sizes.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="number"
                  aria-label={`Size ${i + 1} ml`}
                  className={`${inputClass} !py-1.5`}
                  min={1}
                  max={1000}
                  placeholder="ml"
                  value={s.ml}
                  onChange={(e) => updateSize(i, "ml", Number(e.target.value))}
                />
                <input
                  type="number"
                  aria-label={`Size ${i + 1} price in cents`}
                  className={`${inputClass} !py-1.5`}
                  min={100}
                  max={10000000}
                  placeholder="price (cents)"
                  value={s.priceCents}
                  onChange={(e) => updateSize(i, "priceCents", Number(e.target.value))}
                />
                <button
                  type="button"
                  onClick={() => removeSize(i)}
                  aria-label={`Remove size ${i + 1}`}
                  className="shrink-0 rounded-full border border-parchment px-3 py-1.5 text-xs text-wine hover:border-wine"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-6 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} />
          Featured on homepage
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.published} onChange={(e) => set("published", e.target.checked)} />
          Published (visible in shop)
        </label>
      </div>

      {error && <p className="border border-wine/40 bg-wine/5 px-3 py-2 text-sm text-wine" role="alert">{error}</p>}

      <button type="submit" disabled={busy} className="btn-primary">
        {busy ? "Saving…" : productId ? "Save changes" : "Create product"}
      </button>
    </form>
  );
}
