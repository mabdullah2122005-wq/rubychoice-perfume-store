import { NextRequest, NextResponse, after } from "next/server";
import { db } from "@/lib/db";
import { site } from "@/lib/site";
import { verifyPayfastReturn } from "@/lib/payfast";
import { dispatchOrderEmails } from "@/lib/email";

// PayFast sends the customer back here after the hosted payment page
// (SUCCESS_URL / FAILURE_URL), by GET or form-POST depending on setup.
// Authentication is the validation hash — cookies/CSRF are not involved.

async function handle(params: URLSearchParams) {
  const basketId = params.get("basket_id") ?? params.get("BASKET_ID") ?? "";
  const errCode = params.get("err_code") ?? params.get("ERR_CODE") ?? "";
  const validationHash =
    params.get("validation_hash") ?? params.get("VALIDATION_HASH") ?? undefined;

  const order = basketId
    ? await db.order.findUnique({ where: { id: basketId }, include: { items: true } })
    : null;
  if (!order || order.paymentMethod !== "PAYFAST") {
    return NextResponse.redirect(new URL("/cart", site.url));
  }

  // Only a PENDING order can transition — replayed callbacks are no-ops.
  if (order.status === "PENDING") {
    const verdict = verifyPayfastReturn({ basketId, errCode, validationHash });

    if (verdict === "paid") {
      await db.$transaction(async (tx) => {
        for (const item of order.items) {
          if (!item.productId) continue;
          await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
        }
        if (order.couponCode) {
          await tx.coupon.updateMany({
            where: { code: order.couponCode },
            data: { usedCount: { increment: 1 } },
          });
        }
        await tx.order.update({ where: { id: order.id }, data: { status: "PAID" } });
      });
      after(() => dispatchOrderEmails(order.id, "paid", { alertAdmin: true }));
    } else if (verdict === "failed") {
      await db.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });
      // No stock was reserved, nothing was charged — back to checkout.
      return NextResponse.redirect(new URL("/checkout?payment=failed", site.url));
    }
    // "unverified": PayFast reported success but the hash could not be
    // confirmed — leave PENDING; the success page says payment is being
    // confirmed and the admin verifies before shipping.
  }

  return NextResponse.redirect(
    new URL(`/checkout/success?order=${order.id}`, site.url)
  );
}

export async function GET(request: NextRequest) {
  return handle(request.nextUrl.searchParams);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return handle(new URLSearchParams(body));
}
