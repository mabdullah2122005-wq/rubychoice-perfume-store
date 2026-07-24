import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { site } from "@/lib/site";
import { jsonError } from "@/lib/http";

const PAGE_SIZE = 12;

const publicSelect = {
  id: true,
  slug: true,
  name: true,
  tagline: true,
  productType: true,
  scentFamily: true,
  gender: true,
  notesTop: true,
  notesHeart: true,
  notesBase: true,
  priceCents: true,
  compareAtCents: true,
  sizeMl: true,
  sizes: true,
  stock: true,
  image: true,
  featured: true,
  // Ratings power the stars on product cards rendered from this API.
  reviews: { select: { rating: true } },
} satisfies Prisma.ProductSelect;

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const q = (params.get("q") ?? "").slice(0, 100);
    const family = params.get("family") ?? "";
    const gender = params.get("gender") ?? "";
    const type = params.get("type") ?? "";
    const sort = params.get("sort") ?? "new";
    const page = Math.max(1, Math.min(100, Number(params.get("page")) || 1));

    const where: Prisma.ProductWhereInput = { published: true };
    if ((site.scentFamilies as readonly string[]).includes(family)) {
      where.scentFamily = family;
    }
    if ((site.genders as readonly string[]).includes(gender)) {
      where.gender = gender;
    }
    if ((site.productTypes as readonly string[]).includes(type)) {
      where.productType = type;
    }
    if (q) {
      // mode: "insensitive" — Postgres LIKE is case-sensitive by default.
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { tagline: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { notesTop: { contains: q, mode: "insensitive" } },
        { notesHeart: { contains: q, mode: "insensitive" } },
        { notesBase: { contains: q, mode: "insensitive" } },
      ];
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === "price-asc"
        ? { priceCents: "asc" }
        : sort === "price-desc"
          ? { priceCents: "desc" }
          : sort === "name"
            ? { name: "asc" }
            : { createdAt: "desc" };

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy,
        select: publicSelect,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      db.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
  } catch (error) {
    console.error("products list failed:", error);
    return jsonError("Could not load products.", 500);
  }
}
