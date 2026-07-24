import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { csrfGuard, getClientIp, jsonError, readJson, zodErrorResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const csrf = csrfGuard(request);
    if (csrf) return csrf;

    if (!rateLimit(`register:${getClientIp(request)}`, 5, 60 * 60 * 1000)) {
      return jsonError("Too many accounts created — try again later.", 429);
    }

    const body = await readJson(request);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);
    const { name, email, password } = parsed.data;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return jsonError("An account with this email already exists.", 409);
    }

    // Role is never accepted from client input.
    const user = await db.user.create({
      data: { name, email, passwordHash: await hashPassword(password) },
      select: { id: true, name: true, email: true },
    });

    await createSession(user.id);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("register failed:", error);
    return jsonError("Registration failed — please try again.", 500);
  }
}
