import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { csrfGuard, getClientIp, jsonError, readJson, zodErrorResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

// Compared against when the email doesn't exist, so unknown and known
// emails take a similar amount of time (blunts user enumeration by timing).
const dummyHashPromise = hash("placeholder-password-never-matches", 12);

export async function POST(request: NextRequest) {
  try {
    const csrf = csrfGuard(request);
    if (csrf) return csrf;

    const body = await readJson(request);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);
    const { email, password } = parsed.data;

    const ip = getClientIp(request);
    if (
      !rateLimit(`login:ip:${ip}`, 20, 15 * 60 * 1000) ||
      !rateLimit(`login:email:${email}`, 10, 15 * 60 * 1000)
    ) {
      return jsonError("Too many attempts — try again in 15 minutes.", 429);
    }

    const user = await db.user.findUnique({ where: { email } });
    const valid = user
      ? await verifyPassword(password, user.passwordHash)
      : (await verifyPassword(password, await dummyHashPromise), false);

    if (!user || !valid) {
      return jsonError("Invalid email or password.", 401);
    }

    await createSession(user.id);
    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("login failed:", error);
    return jsonError("Sign-in failed — please try again.", 500);
  }
}
