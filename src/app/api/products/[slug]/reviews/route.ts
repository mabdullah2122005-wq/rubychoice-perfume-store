import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { reviewSchema } from "@/lib/validation";
import { csrfGuard, getClientIp, jsonError, readJson, zodErrorResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const product = await db.product.findUnique({
    where: { slug },
    select: { id: true, published: true },
  });
  if (!product || !product.published) return jsonError("Product not found.", 404);

  const reviews = await db.review.findMany({
    where: { productId: product.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      authorName: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ reviews });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const csrf = csrfGuard(request);
    if (csrf) return csrf;

    // Reviews are open to everyone — no account required.
    const user = await getCurrentUser();

    if (!rateLimit(`review:${getClientIp(request)}`, 8, 60 * 60 * 1000)) {
      return jsonError("Too many reviews — try again later.", 429);
    }

    const { slug } = await params;
    const product = await db.product.findUnique({
      where: { slug },
      select: { id: true, published: true },
    });
    if (!product || !product.published) return jsonError("Product not found.", 404);

    const body = await readJson(request);
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const authorName = user ? user.name : (parsed.data.name ?? "").trim();
    if (!authorName) {
      return jsonError("Please enter your name to post a review.", 400);
    }
    const data = {
      rating: parsed.data.rating,
      title: parsed.data.title,
      body: parsed.data.body,
      authorName,
    };

    // Signed-in shoppers get one editable review per product; guests simply
    // add a new one (rate-limited above).
    const review = user
      ? await db.review.upsert({
          where: { userId_productId: { userId: user.id, productId: product.id } },
          update: data,
          create: { ...data, userId: user.id, productId: product.id },
          select: { id: true, rating: true, title: true, body: true, authorName: true, createdAt: true },
        })
      : await db.review.create({
          data: { ...data, productId: product.id },
          select: { id: true, rating: true, title: true, body: true, authorName: true, createdAt: true },
        });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("review save failed:", error);
    return jsonError("Could not save review.", 500);
  }
}
