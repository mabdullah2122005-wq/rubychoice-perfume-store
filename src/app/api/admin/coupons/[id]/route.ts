import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/auth";
import { couponUpdateSchema } from "@/lib/validation";
import { csrfGuard, jsonError, readJson, zodErrorResponse } from "@/lib/http";

type Props = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const csrf = csrfGuard(request);
    if (csrf) return csrf;

    const admin = await getAdminUser();
    if (!admin) return jsonError("Admin access required.", 403);

    const { id } = await params;
    const body = await readJson(request);
    const parsed = couponUpdateSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const existing = await db.coupon.findUnique({ where: { id } });
    if (!existing) return jsonError("Coupon not found.", 404);

    const coupon = await db.coupon.update({
      where: { id },
      data: { active: parsed.data.active },
    });
    return NextResponse.json({ coupon });
  } catch (error) {
    console.error("coupon update failed:", error);
    return jsonError("Could not update coupon.", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const csrf = csrfGuard(request);
    if (csrf) return csrf;

    const admin = await getAdminUser();
    if (!admin) return jsonError("Admin access required.", 403);

    const { id } = await params;
    const existing = await db.coupon.findUnique({ where: { id } });
    if (!existing) return jsonError("Coupon not found.", 404);

    await db.coupon.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("coupon delete failed:", error);
    return jsonError("Could not delete coupon.", 500);
  }
}
