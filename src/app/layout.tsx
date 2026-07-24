import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { site } from "@/lib/site";
import { getCurrentUser } from "@/lib/auth";
import { getStoreSettings, storefrontClosed } from "@/lib/settings";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import CoverPage from "@/components/CoverPage";
import CartDrawer from "@/components/CartDrawer";
import WelcomeIntro from "@/components/WelcomeIntro";
import { CartProvider } from "@/components/CartProvider";
import { FavouritesProvider } from "@/components/FavouritesProvider";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#100e0b",
};

export async function generateMetadata(): Promise<Metadata> {
  // Keep search engines away from the cover page while the store is closed.
  const settings = await getStoreSettings();
  return {
    metadataBase: new URL(site.url),
    title: {
      default: `${site.name} — Maison de Parfum`,
      template: `%s — ${site.name}`,
    },
    description: site.description,
    openGraph: {
      siteName: site.name,
      type: "website",
    },
    ...(storefrontClosed(settings) ? { robots: { index: false, follow: false } } : {}),
  };
}

// Machine-readable identity for search engines: who the brand is, and that
// the site has an internal search (Google can surface a sitelinks search box).
const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: site.name,
      legalName: site.legalName,
      url: site.url,
      description: site.description,
      address: { "@type": "PostalAddress", addressCountry: "PK" },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        telephone: site.whatsapp.display,
      },
    },
    {
      "@type": "WebSite",
      name: site.name,
      url: site.url,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${site.url}/shop?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Reading headers() opts every route into dynamic rendering, which the
  // nonce-based CSP requires (a fresh nonce must be issued per request).
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-pathname") ?? "/";
  const nonce = requestHeaders.get("x-nonce") ?? undefined;
  const [user, settings] = await Promise.all([getCurrentUser(), getStoreSettings()]);

  // Cover-page gate: while the store is in COMING_SOON/MAINTENANCE mode,
  // visitors see the cover. /login stays reachable (the admin has to get in),
  // /admin has its own auth, and admins browse the real store with a banner.
  const closed = storefrontClosed(settings);
  const isAdmin = user?.role === "ADMIN";
  const exemptPath =
    pathname.startsWith("/admin") || pathname.startsWith("/login");
  const showCover = closed && !isAdmin && !exemptPath;

  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {/* Runs before paint: skips the welcome overlay on repeat visits (no flash). */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html:
              "try{if(sessionStorage.getItem('rc_seen'))document.documentElement.setAttribute('data-welcomed','1')}catch(e){}",
          }}
        />
        <WelcomeIntro />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(siteJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        {showCover ? (
          <CoverPage settings={settings} />
        ) : (
          <CartProvider>
            <FavouritesProvider>
            {closed && isAdmin && (
              <div className="bg-wine px-4 py-2 text-center text-xs font-medium text-cream">
                Storefront hidden — visitors see the{" "}
                {settings.mode === "MAINTENANCE" ? "maintenance" : "launching-soon"} page.
                You&apos;re seeing the store because you&apos;re an admin.{" "}
                <Link href="/admin/settings" className="underline">
                  Manage
                </Link>
              </div>
            )}
            <Header
              user={user ? { name: user.name, role: user.role } : null}
              announcement={settings.announcement}
            />
            <main className="flex-1">{children}</main>
            <Footer />
            <WhatsAppButton />
            <CartDrawer />
            </FavouritesProvider>
          </CartProvider>
        )}
      </body>
    </html>
  );
}
