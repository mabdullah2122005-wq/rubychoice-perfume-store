import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkCoupon } from "@/lib/coupons";
import { couponPreviewSchema } from "@/lib/validation";
import { csrfGuard, getClientIp, jsonError, readJson, zodErrorResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { findSize } from "@/lib/sizes";

// "Apply code" preview for the checkout page. Computes the discount from
// catalog prices; checkout revalidates everything again when the order is
// actually placed.
export async function POST(request: NextRequest) {
  try {
    const csrf = csrfGuard(request);
    if (csrf) return csrf;

    if (!rateLimit(`coupon:${getClientIp(request)}`, 20, 10 * 60 * 1000)) {
      return jsonError("Too many attempts — try again in a few minutes.", 429);
    }

    const body = await readJson(request);
    const parsed = couponPreviewSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const productIds = [...new Set(parsed.data.items.map((i) => i.id))];
    const products = await db.product.findMany({
      where: { id: { in: productIds }, published: true },
      select: { id: true, priceCents: true, sizeMl: true, compareAtCents: true, sizes: true },
    });
    const productById = new Map(products.map((p) => [p.id, p]));
    if (products.length !== productIds.length) {
      return jsonError("Some items are no longer available. Please refresh your cart.", 409);
    }
    let subtotalCents = 0;
    for (const item of parsed.data.items) {
      const product = productById.get(item.id);
      const size = product ? findSize(product, item.sizeMl) : null;
      if (!size) {
        return jsonError("Some items are no longer available. Please refresh your cart.", 409);
      }
      subtotalCents += size.priceCents * Math.min(10, item.quantity);
    }

    const check = await checkCoupon(parsed.data.code, subtotalCents);
    if (!check.ok) return jsonError(check.reason, 404);

    return NextResponse.json({
      code: check.coupon.code,
      discountCents: check.coupon.discountCents,
    });
  } catch (error) {
    console.error("coupon preview failed:", error);
    return jsonError("Could not check that code — please try again.", 500);
  }
}
