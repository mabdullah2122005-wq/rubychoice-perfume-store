import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/auth";
import { productSchema } from "@/lib/validation";
import { csrfGuard, jsonError, readJson, zodErrorResponse } from "@/lib/http";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return jsonError("Admin access required.", 403);
  const products = await db.product.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ products });
}

export async function POST(request: NextRequest) {
  try {
    const csrf = csrfGuard(request);
    if (csrf) return csrf;

    const admin = await getAdminUser();
    if (!admin) return jsonError("Admin access required.", 403);

    const body = await readJson(request);
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const existing = await db.product.findUnique({
      where: { slug: parsed.data.slug },
      select: { id: true },
    });
    if (existing) return jsonError("A product with this slug already exists.", 409);

    const { sizes, ...rest } = parsed.data;
    const product = await db.product.create({
      data: {
        ...rest,
        compareAtCents: parsed.data.compareAtCents ?? null,
        sizes: (sizes ?? []) as Prisma.InputJsonValue,
      },
    });
    revalidateTag("catalog", "max");
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("product create failed:", error);
    return jsonError("Could not create product.", 500);
  }
}
