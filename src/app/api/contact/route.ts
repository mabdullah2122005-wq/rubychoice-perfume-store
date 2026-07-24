import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contactSchema } from "@/lib/validation";
import { csrfGuard, getClientIp, jsonError, readJson, zodErrorResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const csrf = csrfGuard(request);
    if (csrf) return csrf;

    if (!rateLimit(`contact:${getClientIp(request)}`, 5, 60 * 60 * 1000)) {
      return jsonError("Too many messages — try again later.", 429);
    }

    const body = await readJson(request);
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    await db.contactMessage.create({ data: parsed.data });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("contact message failed:", error);
    return jsonError("Could not send message — please try again.", 500);
  }
}
