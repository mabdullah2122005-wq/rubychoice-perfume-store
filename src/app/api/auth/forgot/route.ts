import { NextRequest, NextResponse, after } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { db } from "@/lib/db";
import { site } from "@/lib/site";
import { forgotPasswordSchema } from "@/lib/validation";
import { csrfGuard, getClientIp, jsonError, readJson, zodErrorResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: NextRequest) {
  try {
    const csrf = csrfGuard(request);
    if (csrf) return csrf;

    if (!rateLimit(`forgot:${getClientIp(request)}`, 5, 15 * 60 * 1000)) {
      return jsonError("Too many attempts — try again in a few minutes.", 429);
    }

    const body = await readJson(request);
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const user = await db.user.findUnique({ where: { email: parsed.data.email } });
    // Only send when the account exists — but always return the same response
    // so this endpoint can't be used to discover which emails are registered.
    if (user) {
      const token = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(token).digest("hex");
      // Invalidate any earlier outstanding tokens for this user.
      await db.passwordResetToken.deleteMany({ where: { userId: user.id } });
      await db.passwordResetToken.create({
        data: { tokenHash, userId: user.id, expiresAt: new Date(Date.now() + RESET_TTL_MS) },
      });
      const url = `${site.url}/reset?token=${token}`;
      after(() => sendPasswordResetEmail(user.email, url));
    }

    return NextResponse.json({
      ok: true,
      message: "If an account exists for that email, a reset link is on its way.",
    });
  } catch (error) {
    console.error("forgot password failed:", error);
    return jsonError("Something went wrong — please try again.", 500);
  }
}
