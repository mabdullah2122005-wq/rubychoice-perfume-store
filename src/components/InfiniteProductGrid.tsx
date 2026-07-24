"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ProductCard, { type ProductCardData } from "./ProductCard";

type Filters = { q: string; family: string; gender: string; type: string; sort: string };

const VIEW_KEY = "rubychoice-shop-view";

// Comfortable = bigger cards, fewer per row; compact = the dense default.
const gridClass = {
  compact: "grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4",
  comfortable: "grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-3",
} as const;

type View = keyof typeof gridClass;

/**
 * Product grid that loads the next page automatically when the shopper
 * nears the bottom (IntersectionObserver sentinel — no "page 2" buttons),
 * with a view-density switch that remembers the choice.
 */
export default function InfiniteProductGrid({
  initial,
  total,
  totalPages,
  filters,
}: {
  initial: ProductCardData[];
  total: number;
  totalPages: number;
  filters: Filters;
}) {
  const [items, setItems] = useState<ProductCardData[]>(initial);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [view, setView] = useState<View>("compact");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const done = page >= totalPages;

  useEffect(() => {
    const saved = localStorage.getItem(VIEW_KEY);
    if (saved === "comfortable" || saved === "compact") setView(saved);
  }, []);

  function switchView(next: View) {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {}
  }

  const loadMore = useCallback(async () => {
    if (loading || page >= totalPages) return;
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      if (filters.q) params.set("q", filters.q);
      if (filters.family) params.set("family", filters.family);
      if (filters.gender) params.set("gender", filters.gender);
      if (filters.type) params.set("type", filters.type);
      if (filters.sort && filters.sort !== "new") params.set("sort", filters.sort);
      params.set("page", String(page + 1));
      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) throw new Error("load failed");
      const data = await res.json();
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...(data.products ?? []).filter((p: ProductCardData) => !seen.has(p.id))];
      });
      setPage((p) => p + 1);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [loading, page, totalPages, filters]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || done) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) loadMore();
      },
      // Start fetching well before the shopper actually hits the bottom.
      { rootMargin: "700px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, done]);

  const viewButton = (target: View, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={() => switchView(target)}
      aria-label={label}
      aria-pressed={view === target}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
        view === target
          ? "border-ink bg-ink text-cream"
          : "border-parchment text-ink-soft hover:border-ink/50 hover:text-ink"
      }`}
    >
      {icon}
    </button>
  );

  return (
    <div>
      {/* View density switch */}
      <div className="mt-6 flex items-center justify-end gap-2">
        <span className="mr-1 text-[10px] uppercase tracking-widest text-ink-soft">View</span>
        {viewButton(
          "comfortable",
          "Larger cards",
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="4" y="4" width="16" height="7" rx="1.5" />
            <rect x="4" y="14" width="16" height="7" rx="1.5" />
          </svg>
        )}
        {viewButton(
          "compact",
          "Compact grid",
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="4" y="4" width="7" height="7" rx="1.5" />
            <rect x="13" y="4" width="7" height="7" rx="1.5" />
            <rect x="4" y="13" width="7" height="7" rx="1.5" />
            <rect x="13" y="13" width="7" height="7" rx="1.5" />
          </svg>
        )}
      </div>

      <div className={`mt-4 ${gridClass[view]}`}>
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {/* Auto-load sentinel + status */}
      <div ref={sentinelRef} aria-hidden className="h-px" />
      <div className="mt-8 flex justify-center">
        {loading ? (
          <span
            role="status"
            aria-label="Loading more products"
            className="h-8 w-8 animate-spin rounded-full border-2 border-parchment border-t-ink"
          />
        ) : error ? (
          <button type="button" onClick={loadMore} className="btn-outline">
            Couldn&apos;t load more — try again
          </button>
        ) : done && items.length > 0 ? (
          <p className="text-xs uppercase tracking-[0.25em] text-ink-soft">
            · You&apos;ve seen all {total} composition{total === 1 ? "" : "s"} ·
          </p>
        ) : null}
      </div>
    </div>
  );
}
