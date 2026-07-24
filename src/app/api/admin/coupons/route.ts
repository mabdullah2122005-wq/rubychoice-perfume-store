import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/auth";
import { couponSchema } from "@/lib/validation";
import { csrfGuard, jsonError, readJson, zodErrorResponse } from "@/lib/http";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) return jsonError("Admin access required.", 403);
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ coupons });
}

export async function POST(request: NextRequest) {
  try {
    const csrf = csrfGuard(request);
    if (csrf) return csrf;

    const admin = await getAdminUser();
    if (!admin) return jsonError("Admin access required.", 403);

    const body = await readJson(request);
    const parsed = couponSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const existing = await db.coupon.findUnique({
      where: { code: parsed.data.code },
      select: { id: true },
    });
    if (existing) return jsonError("A coupon with this code already exists.", 409);

    const coupon = await db.coupon.create({
      data: {
        code: parsed.data.code,
        kind: parsed.data.kind,
        value: parsed.data.value,
        minSubtotalCents: parsed.data.minSubtotalCents,
        maxUses: parsed.data.maxUses ?? null,
        expiresAt: parsed.data.expiresAt ?? null,
        active: parsed.data.active,
      },
    });
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    console.error("coupon create failed:", error);
    return jsonError("Could not create coupon.", 500);
  }
}
