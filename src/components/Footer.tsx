import Link from "next/link";
import { site } from "@/lib/site";
import NewsletterForm from "./NewsletterForm";

const columns = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All fragrances" },
      { href: "/shop?type=Eau+de+Parfum", label: "Perfumes" },
      { href: "/shop?type=Attar+Oil", label: "Attars" },
      { href: "/shop?gender=Men", label: "For Him" },
      { href: "/shop?gender=Women", label: "For Her" },
    ],
  },
  {
    title: "Maison",
    links: [
      { href: "/about", label: "Our story" },
      { href: "/faq", label: "FAQ" },
      { href: "/track", label: "Track order" },
      { href: "/favourites", label: "Favourites" },
      { href: "/contact", label: "Contact" },
      { href: "/account", label: "My account" },
    ],
  },
  {
    title: "Policies",
    links: [
      { href: "/shipping", label: "Shipping & delivery" },
      { href: "/returns", label: "Returns & refunds" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
    ],
  },
];

function LinkList({ links }: { links: { href: string; label: string }[] }) {
  return (
    <ul className="space-y-2">
      {links.map((l) => (
        <li key={l.label}>
          <Link href={l.href} className="text-sm text-ink-soft transition hover:text-gold">
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-parchment bg-cream-dark">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14 md:grid md:grid-cols-5 md:gap-10">
        {/* Brand + newsletter */}
        <div className="md:col-span-2">
          <p className="font-serif text-2xl tracking-[0.18em] text-gradient-gold">
            {site.name.toUpperCase()}
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
            Impressions of iconic fragrances and our own signature scents —
            eaux de parfum and traditional attars, composed in our atelier and
            shipped across Pakistan.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="chip">Cash on Delivery</span>
            <span className="chip">Free shipping Rs 5,000+</span>
            <span className="chip">2–4 day delivery</span>
          </div>
          <div className="mt-6">
            <p className="mb-2 text-xs uppercase tracking-widest text-ink-soft">
              Join the maison
            </p>
            <NewsletterForm />
          </div>
        </div>

        {/* Mobile: collapsible drawers (tap to open) */}
        <div className="mt-8 divide-y divide-parchment border-y border-parchment md:hidden">
          {columns.map((col) => (
            <details key={col.title} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between py-3.5 text-xs uppercase tracking-widest text-ink">
                {col.title}
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.6"
                  className="text-ink-soft transition group-open:rotate-180"
                  aria-hidden="true"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </summary>
              <div className="pb-4">
                <LinkList links={col.links} />
              </div>
            </details>
          ))}
        </div>

        {/* Desktop: expanded columns */}
        {columns.map((col) => (
          <div key={col.title} className="hidden md:block">
            <p className="mb-3 text-xs uppercase tracking-widest text-ink-soft">{col.title}</p>
            <LinkList links={col.links} />
          </div>
        ))}
      </div>

      <div className="border-t border-parchment">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-ink-soft sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} {site.legalName}. All rights reserved.</p>
          <p>Cash on Delivery nationwide · Free shipping over Rs 5,000 · WhatsApp {site.whatsapp.display}</p>
        </div>
      </div>
    </footer>
  );
}
