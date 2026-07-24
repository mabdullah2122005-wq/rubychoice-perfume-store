"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { site } from "@/lib/site";

export default function ShopFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  function apply(updates: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete("page");
    router.replace(`/shop?${next.toString()}`);
  }

  const selectClass = "field w-auto cursor-pointer";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q });
        }}
        className="flex w-full overflow-hidden rounded-xl border border-parchment bg-surface transition focus-within:border-gold/60 sm:w-auto"
      >
        <label htmlFor="shop-search" className="sr-only">Search fragrances</label>
        <input
          id="shop-search"
          type="search"
          maxLength={80}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search notes, names…"
          className="w-full bg-transparent px-3.5 py-2.5 text-sm outline-none placeholder:text-ink-soft/60 sm:w-44"
        />
        <button
          type="submit"
          className="bg-gold px-4 text-xs font-semibold uppercase tracking-widest text-cream transition hover:bg-gold-dark"
        >
          Go
        </button>
      </form>

      <label className="sr-only" htmlFor="filter-type">Type</label>
      <select
        id="filter-type"
        className={selectClass}
        value={params.get("type") ?? ""}
        onChange={(e) => apply({ type: e.target.value })}
      >
        <option value="">All types</option>
        {site.productTypes.map((t) => (
          <option key={t} value={t}>{t === "Attar Oil" ? "Attars" : t}</option>
        ))}
      </select>

      <label className="sr-only" htmlFor="filter-family">Scent family</label>
      <select
        id="filter-family"
        className={selectClass}
        value={params.get("family") ?? ""}
        onChange={(e) => apply({ family: e.target.value })}
      >
        <option value="">All families</option>
        {site.scentFamilies.map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>

      <label className="sr-only" htmlFor="filter-gender">For</label>
      <select
        id="filter-gender"
        className={selectClass}
        value={params.get("gender") ?? ""}
        onChange={(e) => apply({ gender: e.target.value })}
      >
        <option value="">Everyone</option>
        {site.genders.map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>

      <label className="sr-only" htmlFor="filter-sort">Sort</label>
      <select
        id="filter-sort"
        className={selectClass}
        value={params.get("sort") ?? "new"}
        onChange={(e) => apply({ sort: e.target.value })}
      >
        <option value="new">Newest</option>
        <option value="price-asc">Price: low to high</option>
        <option value="price-desc">Price: high to low</option>
        <option value="name">Name A–Z</option>
      </select>

      {(params.get("q") || params.get("family") || params.get("gender") || params.get("type")) && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            router.replace("/shop");
          }}
          className="rounded-full border border-wine/40 px-3 py-1.5 text-xs uppercase tracking-widest text-wine transition hover:bg-wine/10"
        >
          Clear ×
        </button>
      )}
    </div>
  );
}
