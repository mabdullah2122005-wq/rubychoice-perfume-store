import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import DeleteProductButton from "@/components/admin/DeleteProductButton";

export default async function AdminProductsPage() {
  const products = await db.product.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-serif text-2xl">Products ({products.length})</h2>
        <Link href="/admin/products/new" className="btn-primary !px-5 !py-2.5">
          + New product
        </Link>
      </div>

      <div className="card-panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-parchment text-left text-xs uppercase tracking-widest text-ink-soft">
              <th className="p-3">Product</th>
              <th className="p-3">Family</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-parchment/60">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <span className="block h-12 w-10 shrink-0 overflow-hidden bg-cream-dark">
                      <img src={p.image} alt="" className="h-full w-full object-cover" />
                    </span>
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-ink-soft">/{p.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3">{p.scentFamily}</td>
                <td className="p-3">{formatPrice(p.priceCents)}</td>
                <td className={`p-3 ${p.stock <= 5 ? "text-wine" : ""}`}>{p.stock}</td>
                <td className="p-3">
                  <span className="text-xs uppercase tracking-wide">
                    {p.published ? "Live" : "Draft"}
                    {p.featured ? " · Featured" : ""}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex gap-4">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="text-xs uppercase tracking-widest text-gold-dark hover:underline"
                    >
                      Edit
                    </Link>
                    <DeleteProductButton productId={p.id} name={p.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
