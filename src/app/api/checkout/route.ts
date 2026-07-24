import { NextRequest, NextResponse, after } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { dispatchOrderEmails } from "@/lib/email";
import { getCurrentUser } from "@/lib/auth";
import { site, shippingCentsFor } from "@/lib/site";
import { payfastConfigured, createPayfastRedirect } from "@/lib/payfast";
import { checkoutSchema } from "@/lib/validation";
import { csrfGuard, getClientIp, jsonError, readJson, zodErrorResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { checkCoupon, redeemCoupon, CouponExhaustedError, type AppliedCoupon } from "@/lib/coupons";
import { getStoreSettings, storefrontClosed } from "@/lib/settings";
import { findSize } from "@/lib/sizes";

class OutOfStockError extends Error {}
class UnavailableLineError extends Error {}

export async function POST(request: NextRequest) {
  try {
    const csrf = csrfGuard(request);
    if (csrf) return csrf;

    if (!rateLimit(`checkout:${getClientIp(request)}`, 10, 60 * 60 * 1000)) {
      return jsonError("Too many checkout attempts — try again later.", 429);
    }

    const body = await readJson(request);
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);
    const { items, customer, paymentMethod } = parsed.data;

    // While the store shows a cover page, only admins may place (test) orders.
    const user = await getCurrentUser();
    const settings = await getStoreSettings();
    if (storefrontClosed(settings) && user?.role !== "ADMIN") {
      return jsonError("The store isn't taking orders right now — please check back soon.", 503);
    }

    // Merge duplicate lines (same product + size), cap quantity per line.
    const lineMap = new Map<string, { id: string; sizeMl: number; quantity: number }>();
    for (const item of items) {
      const key = `${item.id}:${item.sizeMl}`;
      const prev = lineMap.get(key);
      lineMap.set(key, {
        id: item.id,
        sizeMl: item.sizeMl,
        quantity: Math.min(10, (prev?.quantity ?? 0) + item.quantity),
      });
    }
    const lines = [...lineMap.values()];

    // Prices ALWAYS come from the database — the client only sends ids/sizes.
    const productIds = [...new Set(lines.map((l) => l.id))];
    const products = await db.product.findMany({
      where: { id: { in: productIds }, published: true },
    });
    const productById = new Map(products.map((p) => [p.id, p]));
    if (products.length !== productIds.length) {
      return jsonError("Some items are no longer available. Please refresh your cart.", 409);
    }

    // Resolve each line to a real size + its DB price; total stock per product.
    const perProductQty = new Map<string, number>();
    const priced = lines.map((line) => {
      const product = productById.get(line.id)!;
      const size = findSize(product, line.sizeMl);
      if (!size) throw new UnavailableLineError();
      perProductQty.set(line.id, (perProductQty.get(line.id) ?? 0) + line.quantity);
      return { product, sizeMl: line.sizeMl, quantity: line.quantity, unitPrice: size.priceCents };
    });

    for (const [productId, qty] of perProductQty) {
      const product = productById.get(productId)!;
      if (product.stock < qty) {
        return jsonError(
          `Only ${product.stock} bottle(s) of ${product.name} left. Please adjust your cart.`,
          409
        );
      }
    }

    const subtotalCents = priced.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
    // Prepaid methods ship free; COD is judged on the pre-discount subtotal
    // so applying a code never *adds* a fee the cart already promised away.
    const shippingCents = shippingCentsFor(paymentMethod, subtotalCents);

    let coupon: AppliedCoupon | null = null;
    if (parsed.data.couponCode) {
      const check = await checkCoupon(parsed.data.couponCode, subtotalCents);
      if (!check.ok) return jsonError(check.reason, 409);
      coupon = check.coupon;
    }
    const discountCents = coupon?.discountCents ?? 0;
    const totalCents = subtotalCents - discountCents + shippingCents;

    const orderData = {
      paymentMethod,
      email: customer.email,
      phone: customer.phone,
      totalCents,
      shippingCents,
      discountCents,
      couponCode: coupon?.code ?? null,
      currency: site.currency,
      shippingName: customer.name,
      addressLine1: customer.addressLine1,
      addressLine2: customer.addressLine2 || null,
      city: customer.city,
      province: customer.province || null,
      postalCode: customer.postalCode,
      country: customer.country,
      userId: user?.id ?? null,
      items: {
        create: priced.map((l) => ({
          name: `${l.product.name} (${l.sizeMl} ml)`,
          priceCents: l.unitPrice,
          quantity: l.quantity,
          image: l.product.image,
          productId: l.product.id,
        })),
      },
    };

    // COD and bank transfer: reserve stock now, no payment provider involved.
    // COD orders are CONFIRMED (payment collected by the rider); bank-transfer
    // orders stay PENDING until an admin marks them PAID.
    if (paymentMethod === "COD" || paymentMethod === "BANK") {
      try {
        const order = await db.$transaction(async (tx) => {
          const created = await tx.order.create({
            data: {
              ...orderData,
              status: paymentMethod === "COD" ? "CONFIRMED" : "PENDING",
            },
          });
          for (const [productId, qty] of perProductQty) {
            const result = await tx.product.updateMany({
              where: { id: productId, stock: { gte: qty } },
              data: { stock: { decrement: qty } },
            });
            if (result.count === 0) throw new OutOfStockError();
          }
          if (coupon) await redeemCoupon(tx, coupon);
          return created;
        });
        // Confirmation (COD) / transfer-details (BANK) email + owner alert.
        after(() => dispatchOrderEmails(order.id, "placed", { alertAdmin: true }));
        return NextResponse.json({ orderId: order.id, method: paymentMethod });
      } catch (error) {
        if (error instanceof OutOfStockError) {
          return jsonError("An item sold out while you were checking out. Please refresh your cart.", 409);
        }
        if (error instanceof CouponExhaustedError) {
          return jsonError("That discount code just ran out — remove it and try again.", 409);
        }
        throw error;
      }
    }

    // Shared by the dev-only demo modes of CARD and PAYFAST: complete the
    // payment immediately so the full flow can be exercised without a gateway.
    async function completeDemoPayment(orderId: string): Promise<NextResponse | null> {
      try {
        await db.$transaction(async (tx) => {
          for (const [productId, qty] of perProductQty) {
            await tx.product.updateMany({
              where: { id: productId, stock: { gte: qty } },
              data: { stock: { decrement: qty } },
            });
          }
          if (coupon) await redeemCoupon(tx, coupon);
          await tx.order.update({
            where: { id: orderId },
            data: { status: "PAID" },
          });
        });
        // DEMO paid order (dev only) — send the "payment received" email.
        after(() => dispatchOrderEmails(orderId, "paid", { alertAdmin: true }));
        return null;
      } catch (error) {
        if (error instanceof CouponExhaustedError) {
          await db.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
          return jsonError("That discount code just ran out — remove it and try again.", 409);
        }
        throw error;
      }
    }

    // PAYFAST — redirect to PayFast's hosted payment page. The order is
    // created PENDING; our return route marks it PAID after verification.
    if (paymentMethod === "PAYFAST") {
      const order = await db.order.create({
        data: { ...orderData, status: "PENDING" },
      });

      if (!payfastConfigured()) {
        if (process.env.NODE_ENV === "production") {
          await db.order.update({
            where: { id: order.id },
            data: { status: "CANCELLED" },
          });
          return jsonError("Online payment is not available right now — please choose Cash on Delivery or bank transfer.", 503);
        }
        // DEMO MODE (development only).
        const demoError = await completeDemoPayment(order.id);
        if (demoError) return demoError;
        return NextResponse.json({ demo: true, orderId: order.id, method: "PAYFAST" });
      }

      try {
        const redirect = await createPayfastRedirect({
          id: order.id,
          totalCents,
          email: customer.email,
          phone: customer.phone,
        });
        return NextResponse.json({ payfast: redirect, orderId: order.id });
      } catch (error) {
        console.error("payfast redirect failed:", error);
        await db.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" },
        });
        return jsonError("Could not reach PayFast — please try another payment method.", 502);
      }
    }

    // CARD — Stripe-hosted checkout.
    const order = await db.order.create({
      data: { ...orderData, status: "PENDING" },
    });

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey && process.env.NODE_ENV === "production") {
      // Never silently complete unpaid card orders in production.
      await db.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });
      return jsonError("Card payments are not available right now — please choose Cash on Delivery or bank transfer.", 503);
    }
    if (!stripeKey) {
      // DEMO MODE (development only) — card payments without a configured
      // provider complete immediately so the whole flow can be exercised.
      const demoError = await completeDemoPayment(order.id);
      if (demoError) return demoError;
      return NextResponse.json({ demo: true, orderId: order.id, method: "CARD" });
    }

    const stripe = new Stripe(stripeKey);
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = priced.map((l) => ({
      quantity: l.quantity,
      price_data: {
        currency: site.currency,
        unit_amount: l.unitPrice,
        product_data: {
          name: `${l.product.name} (${l.sizeMl} ml)`,
          description: l.product.tagline,
        },
      },
    }));
    if (shippingCents > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: site.currency,
          unit_amount: shippingCents,
          product_data: { name: "Shipping" },
        },
      });
    }

    // Apply the discount as a one-off Stripe coupon so the charged amount
    // matches totalCents; our usedCount is incremented by the paid webhook.
    const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];
    if (coupon && discountCents > 0) {
      const stripeCoupon = await stripe.coupons.create({
        amount_off: discountCents,
        currency: site.currency,
        duration: "once",
        name: coupon.code,
      });
      discounts.push({ coupon: stripeCoupon.id });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      discounts: discounts.length > 0 ? discounts : undefined,
      customer_email: customer.email,
      metadata: { orderId: order.id },
      success_url: `${site.url}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site.url}/cart`,
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
    });

    await db.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof UnavailableLineError) {
      return jsonError("Some items are no longer available in the selected size. Please refresh your cart.", 409);
    }
    console.error("checkout failed:", error);
    return jsonError("Checkout failed — please try again.", 500);
  }
}
