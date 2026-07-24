import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const product = await db.product.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        tagline: true,
        description: true,
        productType: true,
        scentFamily: true,
        gender: true,
        notesTop: true,
        notesHeart: true,
        notesBase: true,
        priceCents: true,
        compareAtCents: true,
        sizeMl: true,
        stock: true,
        image: true,
        published: true,
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            rating: true,
            title: true,
            body: true,
            createdAt: true,
            user: { select: { name: true } },
          },
        },
      },
    });
    if (!product || !product.published) return jsonError("Product not found.", 404);
    const { published: _published, ...publicProduct } = product;
    return NextResponse.json({ product: publicProduct });
  } catch (error) {
    console.error("product fetch failed:", error);
    return jsonError("Could not load product.", 500);
  }
}
