import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsletterSchema } from "@/lib/validation";
import { csrfGuard, getClientIp, jsonError, readJson, zodErrorResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const csrf = csrfGuard(request);
    if (csrf) return csrf;

    if (!rateLimit(`newsletter:${getClientIp(request)}`, 5, 60 * 60 * 1000)) {
      return jsonError("Too many attempts — try again later.", 429);
    }

    const body = await readJson(request);
    const parsed = newsletterSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    // Upsert so resubscribing an existing email doesn't reveal whether it
    // was already on the list.
    await db.newsletterSubscriber.upsert({
      where: { email: parsed.data.email },
      update: {},
      create: { email: parsed.data.email },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("newsletter signup failed:", error);
    return jsonError("Could not subscribe — please try again.", 500);
  }
}
