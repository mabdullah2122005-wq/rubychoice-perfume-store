import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { parseSizes } from "@/lib/sizes";
import ProductForm from "@/components/admin/ProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await db.product.findUnique({ where: { id } });
  if (!product) notFound();

  return (
    <div>
      <h2 className="mb-6 font-serif text-2xl">Edit — {product.name}</h2>
      <ProductForm
        productId={product.id}
        initial={{
          slug: product.slug,
          name: product.name,
          tagline: product.tagline,
          description: product.description,
          productType: product.productType,
          scentFamily: product.scentFamily,
          gender: product.gender,
          notesTop: product.notesTop,
          notesHeart: product.notesHeart,
          notesBase: product.notesBase,
          priceCents: product.priceCents,
          compareAtCents: product.compareAtCents,
          sizeMl: product.sizeMl,
          sizes: parseSizes(product.sizes).map((s) => ({ ml: s.ml, priceCents: s.priceCents })),
          stock: product.stock,
          image: product.image,
          featured: product.featured,
          published: product.published,
        }}
      />
    </div>
  );
}
