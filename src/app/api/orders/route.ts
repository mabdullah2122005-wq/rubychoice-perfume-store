import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { jsonError } from "@/lib/http";

/** The signed-in user's own orders only. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in to view orders.", 401);

  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      status: true,
      totalCents: true,
      shippingCents: true,
      createdAt: true,
      items: {
        select: { id: true, name: true, priceCents: true, quantity: true, image: true },
      },
    },
  });
  return NextResponse.json({ orders });
}
