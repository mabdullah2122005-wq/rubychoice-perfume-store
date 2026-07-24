"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";

type Suggestion = {
  id: string;
  slug: string;
  name: string;
  scentFamily: string;
  productType: string;
  priceCents: number;
  image: string;
};

const POPULAR = ["Oud", "Rose", "Attar", "Amber", "Fresh", "Musk"];

/**
 * Search box with instant suggestions (debounced, cancellable), keyboard
 * navigation, a clear button, and popular searches when empty.
 */
export default function SearchBar({
  onSearch,
  id,
  autoFocus = false,
}: {
  onSearch?: () => void;
  id: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1); // highlighted suggestion index
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Live suggestions, debounced; stale responses are aborted.
  useEffect(() => {
    const query = q.trim();
    if (!query) {
      setResults([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setActive(-1);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        setResults((data.products ?? []).slice(0, 6));
        setTotal(data.total ?? 0);
        setOpen(true);
      } catch {
        // aborted or offline — keep whatever is shown
      } finally {
        setLoading(false);
      }
    }, 160);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  // Close on outside click.
  useEffect(() => {
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  function goTo(path: string) {
    setOpen(false);
    router.push(path);
    onSearch?.();
  }

  function goToAllResults() {
    const query = q.trim();
    goTo(query ? `/shop?q=${encodeURIComponent(query)}` : "/shop");
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(-1, i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      goTo(`/product/${results[active].slug}`);
    }
  }

  const showPopular = open && q.trim() === "";

  return (
    <div ref={rootRef} className="relative w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          goToAllResults();
        }}
        role="search"
        className="flex w-full items-center overflow-hidden rounded-full border border-parchment bg-cream-dark transition focus-within:border-ink/50 focus-within:bg-cream"
      >
        <label htmlFor={id} className="sr-only">
          Search fragrances
        </label>
        <input
          ref={inputRef}
          id={id}
          type="text"
          maxLength={80}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search perfumes, attars, notes…"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          className="w-full bg-transparent px-5 py-2.5 text-sm outline-none placeholder:text-ink-soft/70"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="mr-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-soft transition hover:text-ink"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
        <button
          type="submit"
          aria-label="Search"
          className="mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-soft transition hover:bg-ink hover:text-cream"
        >
          {loading ? (
            <span
              aria-hidden
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            />
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.5-4.5" />
            </svg>
          )}
        </button>
      </form>

      {open && (
        <div
          id={`${id}-list`}
          className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-parchment bg-surface shadow-2xl shadow-black/15"
        >
          {showPopular ? (
            <div className="p-4">
              <p className="mb-2 text-[10px] uppercase tracking-widest text-ink-soft">Popular searches</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => goTo(`/shop?q=${encodeURIComponent(term)}`)}
                    className="rounded-full border border-parchment px-3 py-1.5 text-xs transition hover:border-ink hover:bg-ink hover:text-cream"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : q.trim() === "" ? null : loading && results.length === 0 ? (
            <p className="px-4 py-4 text-sm text-ink-soft">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-4 text-sm text-ink-soft">
              Nothing matches “{q.trim()}” — try a note like “rose” or “oud”.
            </p>
          ) : (
            <>
              <ul className="max-h-[60vh] divide-y divide-parchment/60 overflow-y-auto">
                {results.map((p, i) => (
                  <li key={p.id}>
                    <Link
                      href={`/product/${p.slug}`}
                      onClick={() => {
                        setOpen(false);
                        onSearch?.();
                      }}
                      onMouseEnter={() => setActive(i)}
                      className={`flex items-center gap-3 px-3 py-2.5 transition ${
                        active === i ? "bg-cream-dark" : "hover:bg-cream-dark"
                      }`}
                    >
                      <span className="relative block h-12 w-10 shrink-0 overflow-hidden rounded-md border border-parchment bg-cream-dark">
                        <Image src={p.image} alt="" fill sizes="40px" className="object-cover" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-serif text-sm">{p.name}</span>
                        <span className="block text-[10px] uppercase tracking-widest text-ink-soft">
                          {p.productType === "Attar Oil" ? "Attar" : p.scentFamily}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm">{formatPrice(p.priceCents)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={goToAllResults}
                className="block w-full border-t border-parchment px-4 py-2.5 text-center text-xs uppercase tracking-widest text-gold-dark transition hover:bg-cream-dark"
              >
                See all {total} result{total === 1 ? "" : "s"} →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
