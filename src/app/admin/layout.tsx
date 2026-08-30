import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";

export const metadata = { title: "Admin" };

const nav = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/settings", label: "Settings" },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Role check against the database on every admin render — the proxy only
  // verifies that a session exists.
  const admin = await getAdminUser();
  if (!admin) redirect("/login?next=/admin");

  const pathname = (await headers()).get("x-pathname") ?? "/admin";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-parchment pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-wine">Back office</p>
          <h1 className="mt-1 font-serif text-3xl">Administration</h1>
          <p className="mt-1 text-sm text-ink-soft">Signed in as {admin.email}</p>
        </div>
        <nav className="flex flex-wrap gap-1 sm:gap-2">
          {nav.map((item) => {
            const active =
              "exact" in item && item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-ink text-cream"
                    : "text-ink-soft hover:bg-cream-dark hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/"
            className="rounded-full px-3 py-1.5 text-sm text-ink-soft transition hover:bg-cream-dark hover:text-ink"
          >
            ← Storefront
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
