import { NextRequest, NextResponse, after } from "next/server";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/auth";
import { orderStatusSchema } from "@/lib/validation";
import { csrfGuard, jsonError, readJson, zodErrorResponse } from "@/lib/http";
import { dispatchOrderEmails } from "@/lib/email";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const csrf = csrfGuard(request);
    if (csrf) return csrf;

    const admin = await getAdminUser();
    if (!admin) return jsonError("Admin access required.", 403);

    const { id } = await params;
    const body = await readJson(request);
    const parsed = orderStatusSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const target = await db.order.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!target) return jsonError("Order not found.", 404);

    const nextStatus = parsed.data.status;
    const data: {
      status: string;
      courierName?: string | null;
      trackingNumber?: string | null;
    } = { status: nextStatus };
    // Persist courier details when shipping.
    if (nextStatus === "SHIPPED") {
      if (parsed.data.courierName !== undefined) {
        data.courierName = parsed.data.courierName || null;
      }
      if (parsed.data.trackingNumber !== undefined) {
        data.trackingNumber = parsed.data.trackingNumber || null;
      }
    }

    const order = await db.order.update({
      where: { id },
      data,
      select: { id: true, status: true, courierName: true, trackingNumber: true },
    });

    // Email the customer only on real transitions into SHIPPED / DELIVERED
    // (not on a no-op re-save of the same status).
    if (nextStatus !== target.status) {
      if (nextStatus === "SHIPPED") {
        after(() => dispatchOrderEmails(order.id, "shipped"));
      } else if (nextStatus === "DELIVERED") {
        after(() => dispatchOrderEmails(order.id, "delivered"));
      }
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("order update failed:", error);
    return jsonError("Could not update order.", 500);
  }
}
