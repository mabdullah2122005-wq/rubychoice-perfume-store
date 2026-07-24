import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { trackOrderSchema } from "@/lib/validation";
import { parseOrderNumber } from "@/lib/format";
import { csrfGuard, getClientIp, jsonError, readJson, zodErrorResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

const digits = (v: string) => v.replace(/\D/g, "");

// Guest order tracking: the order id alone is unguessable (cuid), and we
// additionally require the checkout email or phone so a leaked id in a chat
// screenshot doesn't expose the address-free summary to strangers.
export async function POST(request: NextRequest) {
  try {
    const csrf = csrfGuard(request);
    if (csrf) return csrf;

    if (!rateLimit(`track:${getClientIp(request)}`, 15, 10 * 60 * 1000)) {
      return jsonError("Too many attempts — try again in a few minutes.", 429);
    }

    const body = await readJson(request);
    const parsed = trackOrderSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const orderNumber = parseOrderNumber(parsed.data.orderNumber);
    const order = orderNumber
      ? await db.order.findUnique({
          where: { orderNumber },
          include: { items: { select: { name: true, quantity: true } } },
        })
      : null;

    const contact = parsed.data.contact.toLowerCase();
    const contactDigits = digits(contact);
    const phoneMatch =
      contactDigits.length >= 9 &&
      digits(order?.phone ?? "").endsWith(contactDigits.slice(-10));
    const emailMatch = order?.email.toLowerCase() === contact;

    if (!order || (!emailMatch && !phoneMatch)) {
      // One generic message — don't reveal whether the order exists.
      return jsonError("No order found with those details — check the order number and the email/phone you used.", 404);
    }

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentMethod: order.paymentMethod,
        totalCents: order.totalCents,
        createdAt: order.createdAt,
        city: order.city,
        courierName: order.courierName,
        trackingNumber: order.trackingNumber,
        items: order.items,
      },
    });
  } catch (error) {
    console.error("order tracking failed:", error);
    return jsonError("Could not look that up — please try again.", 500);
  }
}
