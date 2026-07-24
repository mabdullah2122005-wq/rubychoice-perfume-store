import type { Prisma } from "@prisma/client";
import { db } from "./db";
import { formatPrice } from "./format";

export type AppliedCoupon = {
  id: string;
  code: string;
  kind: string; // PERCENT | FIXED
  value: number;
  maxUses: number | null;
  discountCents: number;
};

export type CouponCheck =
  | { ok: true; coupon: AppliedCoupon }
  | { ok: false; reason: string };

/**
 * Validates a code against the current DB-priced subtotal and computes the
 * discount it grants. The discount is never taken from the client — checkout
 * always re-runs this against catalog prices.
 */
export async function checkCoupon(
  code: string,
  subtotalCents: number
): Promise<CouponCheck> {
  const coupon = await db.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
  });
  if (!coupon || !coupon.active) {
    return { ok: false, reason: "That discount code is not valid." };
  }
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: "That discount code has expired." };
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, reason: "That discount code has been fully redeemed." };
  }
  if (subtotalCents < coupon.minSubtotalCents) {
    return {
      ok: false,
      reason: `This code applies to orders of ${formatPrice(coupon.minSubtotalCents)} or more.`,
    };
  }

  const discountCents =
    coupon.kind === "PERCENT"
      ? Math.floor((subtotalCents * coupon.value) / 100)
      : Math.min(coupon.value, subtotalCents);

  return {
    ok: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      kind: coupon.kind,
      value: coupon.value,
      maxUses: coupon.maxUses,
      discountCents,
    },
  };
}

export class CouponExhaustedError extends Error {}

/**
 * Consumes one use inside an order transaction. The guarded updateMany means
 * two simultaneous checkouts cannot overspend a limited code — the loser
 * gets CouponExhaustedError and the whole order rolls back.
 */
export async function redeemCoupon(
  tx: Prisma.TransactionClient,
  coupon: AppliedCoupon
): Promise<void> {
  const result = await tx.coupon.updateMany({
    where: {
      id: coupon.id,
      active: true,
      ...(coupon.maxUses === null ? {} : { usedCount: { lt: coupon.maxUses } }),
    },
    data: { usedCount: { increment: 1 } },
  });
  if (result.count === 0) throw new CouponExhaustedError();
}
