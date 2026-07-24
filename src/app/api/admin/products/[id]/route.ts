import { NextRequest, NextResponse, after } from "next/server";
import { revalidateTag } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/auth";
import { productSchema } from "@/lib/validation";
import { csrfGuard, jsonError, readJson, zodErrorResponse } from "@/lib/http";
import { dispatchBackInStock } from "@/lib/email";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const csrf = csrfGuard(request);
    if (csrf) return csrf;

    const admin = await getAdminUser();
    if (!admin) return jsonError("Admin access required.", 403);

    const { id } = await params;
    const body = await readJson(request);
    const parsed = productSchema.partial().safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const target = await db.product.findUnique({ where: { id }, select: { id: true, stock: true } });
    if (!target) return jsonError("Product not found.", 404);

    if (parsed.data.slug) {
      const clash = await db.product.findUnique({
        where: { slug: parsed.data.slug },
        select: { id: true },
      });
      if (clash && clash.id !== id) {
        return jsonError("A product with this slug already exists.", 409);
      }
    }

    const { sizes, ...rest } = parsed.data;
    const product = await db.product.update({
      where: { id },
      data: {
        ...rest,
        ...(sizes !== undefined ? { sizes: sizes as Prisma.InputJsonValue } : {}),
      },
    });

    // Restocked from zero → email everyone who asked to be notified.
    if (target.stock <= 0 && product.stock > 0) {
      after(() => dispatchBackInStock(product.id));
    }

    revalidateTag("catalog", "max");
    return NextResponse.json({ product });
  } catch (error) {
    console.error("product update failed:", error);
    return jsonError("Could not update product.", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const csrf = csrfGuard(request);
    if (csrf) return csrf;

    const admin = await getAdminUser();
    if (!admin) return jsonError("Admin access required.", 403);

    const { id } = await params;
    const target = await db.product.findUnique({ where: { id }, select: { id: true } });
    if (!target) return jsonError("Product not found.", 404);

    // Order items keep their snapshot (productId becomes null via SetNull).
    await db.product.delete({ where: { id } });
    revalidateTag("catalog", "max");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("product delete failed:", error);
    return jsonError("Could not delete product.", 500);
  }
}
