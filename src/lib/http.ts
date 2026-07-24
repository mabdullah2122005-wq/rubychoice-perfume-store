import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function zodErrorResponse(error: ZodError): NextResponse {
  const first = error.issues[0];
  const message = first
    ? `${first.path.join(".") || "input"}: ${first.message}`
    : "Invalid input.";
  return jsonError(message, 400);
}

/**
 * CSRF defense-in-depth for state-changing endpoints, on top of
 * SameSite=Lax session cookies: browsers attach an Origin header to all
 * cross-origin (and same-origin non-GET) requests, so a mismatched Origin
 * is rejected. Requests without an Origin header (curl, server-to-server)
 * carry no ambient cookies from a victim's browser, so they pass through.
 */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function csrfGuard(request: NextRequest): NextResponse | null {
  if (!isSameOrigin(request)) {
    return jsonError("Cross-origin request rejected.", 403);
  }
  return null;
}

/** Best-effort client IP for rate limiting (first hop of x-forwarded-for). */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "local";
}

/** Parse a JSON body without throwing, with a size sanity check. */
export async function readJson(request: NextRequest): Promise<unknown | null> {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > 100_000) return null;
  try {
    return await request.json();
  } catch {
    return null;
  }
}
