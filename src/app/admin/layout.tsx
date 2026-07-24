import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";

export const metadata = { title: "Admin" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Role check against the database on every admin render — the proxy only
  // verifies that a session exists.
  const admin = await getAdminUser();
  if (!admin) redirect("/login?next=/admin");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-parchment pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-wine">Back office</p>
          <h1 className="mt-1 font-serif text-3xl">Administration</h1>
        </div>
        <nav className="flex gap-5 text-sm">
          <Link href="/admin" className="hover:text-gold-dark">Dashboard</Link>
          <Link href="/admin/products" className="hover:text-gold-dark">Products</Link>
          <Link href="/admin/orders" className="hover:text-gold-dark">Orders</Link>
          <Link href="/admin/coupons" className="hover:text-gold-dark">Coupons</Link>
          <Link href="/admin/settings" className="hover:text-gold-dark">Settings</Link>
          <Link href="/" className="text-ink-soft hover:text-gold-dark">← Storefront</Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
