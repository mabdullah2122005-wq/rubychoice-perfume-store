import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stockNotifySchema } from "@/lib/validation";
import { csrfGuard, getClientIp, jsonError, readJson, zodErrorResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

// Register interest in an out-of-stock product; we email when it returns.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const csrf = csrfGuard(request);
    if (csrf) return csrf;

    if (!rateLimit(`notify:${getClientIp(request)}`, 10, 10 * 60 * 1000)) {
      return jsonError("Too many requests — try again shortly.", 429);
    }

    const { slug } = await params;
    const body = await readJson(request);
    const parsed = stockNotifySchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const product = await db.product.findUnique({
      where: { slug },
      select: { id: true, stock: true, published: true },
    });
    if (!product || !product.published) return jsonError("Product not found.", 404);

    if (product.stock > 0) {
      // Already available — no need to wait.
      return NextResponse.json({ ok: true, inStock: true });
    }

    // Idempotent: re-registering the same email just refreshes the request.
    await db.stockNotification.upsert({
      where: { email_productId: { email: parsed.data.email, productId: product.id } },
      update: { notifiedAt: null, createdAt: new Date() },
      create: { email: parsed.data.email, productId: product.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("stock notify failed:", error);
    return jsonError("Could not register — please try again.", 500);
  }
}
