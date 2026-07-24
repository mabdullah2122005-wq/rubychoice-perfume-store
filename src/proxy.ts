import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

// Runs before every matched request (Node.js runtime in Next 16).
// Responsibilities:
//  1. Nonce-based Content-Security-Policy for HTML pages (strict-dynamic).
//  2. Coarse auth gate for /account and /admin (redirect to /login).
//     Fine-grained authorization (e.g. the ADMIN role) is enforced again
//     server-side in layouts and API handlers against the database.

// The checkout hands customers to PayFast via a cross-origin form POST, so
// its origin must be allowed in form-action once the gateway is configured.
function payfastFormOrigin(): string {
  if (!process.env.PAYFAST_MERCHANT_ID || !process.env.PAYFAST_SECURED_KEY) return "";
  try {
    return " " + new URL(process.env.PAYFAST_BASE_URL || "https://ipguat.apps.net.pk").origin;
  } catch {
    return "";
  }
}

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // unsafe-inline styles: required by React/Next runtime style injection;
    // scripts remain strictly nonce-gated, which is what blocks XSS payloads.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data:`,
    `font-src 'self'`,
    `connect-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'${payfastFormOrigin()}`,
    `frame-ancestors 'none'`,
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API routes: no CSP needed for JSON; auth/CSRF handled in each handler.
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Favourites moved to the guest-friendly /favourites page.
  if (pathname === "/account/wishlist") {
    return NextResponse.redirect(new URL("/favourites", request.url));
  }

  // Auth gate for protected areas. /account/wishlist is exempt — it just
  // redirects to the guest-friendly /favourites page (no login needed).
  if (
    (pathname.startsWith("/account") && pathname !== "/account/wishlist") ||
    pathname.startsWith("/admin")
  ) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const userId = token ? await verifySessionToken(token) : null;
    if (!userId) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Nonce-based CSP for page requests.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Lets the root layout know which page is rendering (cover-page exemptions).
  requestHeaders.set("x-pathname", pathname);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Everything except static assets and metadata files.
      source:
        "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|products/|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
