"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";
import { useFavourites } from "./FavouritesProvider";
import SearchBar from "./SearchBar";
import { site } from "@/lib/site";

const navLinks = [
  { href: "/shop", label: "All Fragrances" },
  { href: "/shop?type=Eau+de+Parfum", label: "Perfumes" },
  { href: "/shop?type=Attar+Oil", label: "Attars" },
  { href: "/faq", label: "FAQ" },
  { href: "/about", label: "Our Story" },
  { href: "/contact", label: "Contact" },
];

export default function Header({
  user,
  announcement,
}: {
  user: { name: string; role: string } | null;
  announcement?: string;
}) {
  const { count, openCart } = useCart();
  const { count: favCount } = useFavourites();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      {/* Announcement bar */}
      <div className="bg-ink text-center text-[11px] font-medium uppercase tracking-[0.18em] text-cream">
        <p className="px-4 py-2">
          {announcement || "Cash on Delivery nationwide · Free shipping over Rs 5,000"}
        </p>
      </div>

      <div className="border-b border-parchment bg-cream/95 shadow-sm shadow-black/[0.04] backdrop-blur-xl">
        {/* Main row: logo · search · actions */}
        <div className="mx-auto flex h-20 max-w-6xl items-center gap-4 px-4 sm:gap-8 sm:px-6">
          <button
            type="button"
            className="-ml-1 p-1 lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>

          <Link
            href="/"
            className="shrink-0 font-serif text-2xl tracking-[0.22em] text-ink sm:text-3xl"
          >
            {site.name.toUpperCase()}
          </Link>

          <div className="hidden flex-1 justify-center px-4 md:flex">
            <div className="w-full max-w-lg">
              <SearchBar id="header-search" />
            </div>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-5">
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="hidden rounded-full border border-ink/30 px-3.5 py-1.5 text-[10px] uppercase tracking-widest text-ink transition hover:bg-ink hover:text-cream sm:block"
              >
                Admin
              </Link>
            )}
            <Link
              href="/track"
              className="hidden text-xs uppercase tracking-widest text-ink-soft transition hover:text-ink lg:block"
            >
              Track order
            </Link>
            <Link
              href={user ? "/account" : "/login"}
              className="hidden items-center gap-1.5 text-sm text-ink-soft transition hover:text-ink sm:flex"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <circle cx="12" cy="8" r="3.5" />
                <path d="M4.5 20c1.3-3.5 4.2-5 7.5-5s6.2 1.5 7.5 5" />
              </svg>
              {user ? user.name.split(" ")[0] : "Sign in"}
            </Link>
            <button
              type="button"
              onClick={() => setSearchOpen((s) => !s)}
              className="p-1 text-ink-soft transition hover:text-ink md:hidden"
              aria-label="Search"
              aria-expanded={searchOpen}
            >
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.5-4.5" />
              </svg>
            </button>
            <Link
              href="/favourites"
              className="relative p-1 text-ink-soft transition hover:text-wine"
              aria-label={`Favourites, ${favCount} saved`}
            >
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M12 21s-7.5-4.7-9.7-9.2C.8 8.6 2.8 5 6.4 5c2.2 0 3.7 1.2 5.6 3.4C13.9 6.2 15.4 5 17.6 5c3.6 0 5.6 3.6 4.1 6.8C19.5 16.3 12 21 12 21z" />
              </svg>
              {favCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-wine px-1 text-[10px] font-semibold text-cream">
                  {favCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={openCart}
              className="relative p-1 text-ink-soft transition hover:text-ink"
              aria-label={`Open cart, ${count} items`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 2 3 6v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {count > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-semibold text-cream">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile search — revealed when the search icon is tapped */}
        {searchOpen && (
          <div className="flex items-center gap-2 px-4 pb-3 md:hidden">
            <div className="flex-1">
              <SearchBar id="header-search-mobile" autoFocus onSearch={() => setSearchOpen(false)} />
            </div>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="shrink-0 text-xs uppercase tracking-widest text-ink-soft"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Desktop category nav */}
        <nav className="hidden justify-center gap-8 border-t border-parchment/70 py-3 lg:flex">
          {navLinks.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="nav-link text-[13px] uppercase tracking-[0.14em] text-ink-soft transition hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Mobile menu */}
        {open && (
          <nav
            className="border-t border-parchment bg-cream px-4 pb-5 pt-2 lg:hidden"
            key={pathname}
          >
            {navLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block border-b border-parchment/60 py-3 text-sm uppercase tracking-[0.14em] text-ink-soft transition hover:text-ink"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/favourites"
              onClick={() => setOpen(false)}
              className="block border-b border-parchment/60 py-3 text-sm uppercase tracking-[0.14em] text-ink-soft transition hover:text-ink"
            >
              Favourites{favCount > 0 ? ` (${favCount})` : ""}
            </Link>
            <Link
              href="/track"
              onClick={() => setOpen(false)}
              className="block border-b border-parchment/60 py-3 text-sm uppercase tracking-[0.14em] text-ink-soft transition hover:text-ink"
            >
              Track order
            </Link>
            <div className="mt-4 flex gap-3">
              <Link
                href={user ? "/account" : "/login"}
                onClick={() => setOpen(false)}
                className="btn-outline flex-1 !py-2.5"
              >
                {user ? "My account" : "Sign in"}
              </Link>
              {user?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="btn-primary flex-1 !py-2.5"
                >
                  Admin
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
