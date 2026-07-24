import { NextRequest, NextResponse, after } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { dispatchOrderEmails } from "@/lib/email";

// Stripe webhook endpoint. Authentication is the signature check — no
// cookies/CSRF involved. Configure the endpoint secret in STRIPE_WEBHOOK_SECRET.
export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) {
    return jsonError("Stripe is not configured.", 503);
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return jsonError("Missing signature.", 400);

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(stripeKey);
    event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error("webhook signature verification failed:", error);
    return jsonError("Invalid signature.", 400);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const order = await db.order.findFirst({
          where: {
            OR: [
              { id: session.metadata?.orderId ?? "" },
              { stripeSessionId: session.id },
            ],
          },
          include: { items: true },
        });
        if (order && order.status === "PENDING") {
          await db.$transaction(async (tx) => {
            for (const item of order.items) {
              if (!item.productId) continue;
              await tx.product.updateMany({
                where: { id: item.productId, stock: { gte: item.quantity } },
                data: { stock: { decrement: item.quantity } },
              });
            }
            if (order.couponCode) {
              // Payment is already collected — count the redemption even if
              // the code was deactivated in the meantime.
              await tx.coupon.updateMany({
                where: { code: order.couponCode },
                data: { usedCount: { increment: 1 } },
              });
            }
            await tx.order.update({
              where: { id: order.id },
              data: { status: "PAID" },
            });
          });
          after(() => dispatchOrderEmails(order.id, "paid", { alertAdmin: true }));
        }
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object;
        await db.order.updateMany({
          where: { stripeSessionId: session.id, status: "PENDING" },
          data: { status: "CANCELLED" },
        });
        break;
      }
      default:
        break;
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("webhook handling failed:", error);
    // 500 so Stripe retries the delivery.
    return jsonError("Webhook processing failed.", 500);
  }
}
