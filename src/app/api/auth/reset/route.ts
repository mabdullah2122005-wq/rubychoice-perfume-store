import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validation";
import { csrfGuard, getClientIp, jsonError, readJson, zodErrorResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const csrf = csrfGuard(request);
    if (csrf) return csrf;

    if (!rateLimit(`reset:${getClientIp(request)}`, 10, 15 * 60 * 1000)) {
      return jsonError("Too many attempts — try again in a few minutes.", 429);
    }

    const body = await readJson(request);
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
    const record = await db.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true } } },
    });

    if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
      return jsonError("This reset link is invalid or has expired. Please request a new one.", 400);
    }

    const passwordHash = await hashPassword(parsed.data.password);
    await db.$transaction([
      db.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      // Clear any other outstanding tokens for this user.
      db.passwordResetToken.deleteMany({
        where: { userId: record.userId, id: { not: record.id } },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("reset password failed:", error);
    return jsonError("Could not reset your password — please try again.", 500);
  }
}
