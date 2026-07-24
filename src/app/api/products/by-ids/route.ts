import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/http";

const publicSelect = {
  id: true,
  slug: true,
  name: true,
  tagline: true,
  productType: true,
  scentFamily: true,
  notesTop: true,
  priceCents: true,
  compareAtCents: true,
  sizeMl: true,
  sizes: true,
  stock: true,
  image: true,
  reviews: { select: { rating: true } },
} satisfies Prisma.ProductSelect;

// Fetches fresh data for a set of product ids (used by the favourites page so
// prices, stock and sale badges are always current, not the saved snapshot).
export async function GET(request: NextRequest) {
  try {
    const raw = (request.nextUrl.searchParams.get("ids") ?? "").trim();
    if (!raw) return NextResponse.json({ products: [] });

    const ids = raw.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 100);
    if (ids.length === 0) return NextResponse.json({ products: [] });

    const found = await db.product.findMany({
      where: { id: { in: ids }, published: true },
      select: publicSelect,
    });

    // Preserve the caller's order (most-recently-favourited first).
    const byId = new Map(found.map((p) => [p.id, p]));
    const products = ids.map((id) => byId.get(id)).filter(Boolean);

    return NextResponse.json({ products });
  } catch (error) {
    console.error("products by-ids failed:", error);
    return jsonError("Could not load products.", 500);
  }
}
