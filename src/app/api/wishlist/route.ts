import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { wishlistToggleSchema } from "@/lib/validation";
import { csrfGuard, jsonError, readJson, zodErrorResponse } from "@/lib/http";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in to view your wishlist.", 401);

  const items = await db.wishlistItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          tagline: true,
          scentFamily: true,
          priceCents: true,
          compareAtCents: true,
          sizeMl: true,
          stock: true,
          image: true,
          published: true,
        },
      },
    },
  });
  return NextResponse.json({
    products: items.map((i) => i.product).filter((p) => p.published),
  });
}

/** Toggles a product in the wishlist; returns the new state. */
export async function POST(request: NextRequest) {
  try {
    const csrf = csrfGuard(request);
    if (csrf) return csrf;

    const user = await getCurrentUser();
    if (!user) return jsonError("Sign in to save to your wishlist.", 401);

    const body = await readJson(request);
    const parsed = wishlistToggleSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);
    const { productId } = parsed.data;

    const product = await db.product.findUnique({
      where: { id: productId },
      select: { id: true, published: true },
    });
    if (!product || !product.published) return jsonError("Product not found.", 404);

    const existing = await db.wishlistItem.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });

    if (existing) {
      await db.wishlistItem.delete({ where: { id: existing.id } });
      return NextResponse.json({ wishlisted: false });
    }
    await db.wishlistItem.create({ data: { userId: user.id, productId } });
    return NextResponse.json({ wishlisted: true });
  } catch (error) {
    console.error("wishlist toggle failed:", error);
    return jsonError("Could not update wishlist.", 500);
  }
}
