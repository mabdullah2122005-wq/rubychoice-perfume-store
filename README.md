# Lumière — Perfume Brand E‑Commerce (Pakistan)

A complete, security-hardened online store for a Pakistan-based perfume brand.
Built with **Next.js 16** (App Router, Turbopack), **TypeScript**,
**Tailwind CSS v4**, **Prisma** (SQLite locally / Postgres in production),
and JWT session auth. Prices in **PKR**; payments via **Cash on Delivery**,
**bank transfer**, and optionally cards.

> Rename the brand, WhatsApp number, bank details, shipping rates — all in one
> place: [`src/lib/site.ts`](src/lib/site.ts).

## Features

**Storefront**
- Editorial homepage: hero, shop-by-category photo grid, **best sellers ranked
  by real units sold** (cancelled orders excluded; tops up with most-reviewed
  products while sales data is thin), featured products, customer testimonials
  pulled from real reviews, brand story, new arrivals
- Shop with full-text search, scent-family / gender / type filters, sorting, pagination
- Product pages with note pyramid, stock badges, related products
- Reviews with star ratings (one per user per product, editable)
- Wishlist (per account), cart (client-side, server-validated) with a
  free-shipping progress bar, newsletter, contact form, FAQ page
- SEO structured data (JSON-LD): Product rich results (price/stock/rating),
  Organization, WebSite sitelinks-search, FAQPage

**Commerce (Pakistan-first)**
- **Cash on Delivery** nationwide — the default; stock is reserved at order time
- **Bank transfer** — customer gets IBAN + order reference; admin marks PAID on receipt
- **PayFast (Pakistan)** — hosted checkout redirect (cards, wallets, bank
  accounts); set the `PAYFAST_*` env vars and it goes live. Payment returns
  are hash-verified; unverifiable callbacks stay PENDING for admin review.
- **Card option** — an inline card form at checkout (Luhn/expiry/CVC checks,
  brand detection). Card details are validated in the browser and **never sent
  to this server**; charging happens on the gateway side (Stripe-hosted when a
  key is set, demo mode in development)
- **WhatsApp ordering** — floating chat button on every page + "Order on WhatsApp"
  on each product (pre-filled message with the product link)
- PKR pricing (stored in paisa). **Shipping: free for all prepaid orders**
  (bank transfer / card / PayFast); COD carries a flat Rs 300, waived over
  Rs 5,000 — the standard incentive to prepay, which also cuts COD refusals
- Phone number captured on every order (couriers call before delivery), province select
- **Attar line** — traditional concentrated oils as a distinct product type with
  its own navigation and shop filter
- Compare-at pricing, order history per account
- **Discount codes** — percent or fixed-amount, with minimum order, usage cap
  and expiry; applied at checkout (the server recomputes the discount from
  catalog prices — the client never sends amounts). The seed creates
  `WELCOME10` (10% off orders of Rs 2,500+); manage codes at `/admin/coupons`.

**Accounts & Admin**
- Register / sign in / sign out (bcrypt cost 12, JWT httpOnly session cookies, 7-day expiry)
- **Password reset** by email (1-hour single-use token) and **back-in-stock
  alerts** ("notify me" on sold-out products → auto-email when restocked)
- **Legal pages** — Privacy, Terms, Return & Refund, Shipping & Delivery
  (required for payment-gateway approval; linked in the footer + sitemap)
- Account area: profile, order history, wishlist
- Admin panel (`/admin`): revenue/order/product/subscriber dashboard, product CRUD,
  order status management, discount-code management, contact-message inbox
- **Order emails** — customers get a branded email at every step: order
  confirmed (or bank-transfer details), payment received, shipped (with courier
  + tracking number), and delivered. The owner can get a new-order alert too.
  Sent via [Resend](https://resend.com) with Next's `after()` so email latency
  never delays checkout; without `RESEND_API_KEY` set, emails are logged to the
  console instead (so nothing breaks in development).
- **Order management** (`/admin/orders`): filter tabs (Needs action / Confirmed
  / Paid / Shipped / Delivered / …) with live counts; mark orders shipped with
  a courier name + tracking number that flow into the customer's email and the
  public tracking page.
- **Store settings** (`/admin/settings`): switch the storefront between
  **Live / Launching soon / Maintenance**. Closed modes show a branded cover
  page (custom headline/message, newsletter capture, optional countdown that
  **opens the store automatically** at launch time), block checkout (503),
  and send `noindex` to search engines. Admins bypass the cover (a banner
  reminds them visitors can't see the store). The announcement bar text is
  editable here too — handy for sale promos.

## Quick start

```bash
npm install            # also runs prisma generate
npx prisma db push     # create/refresh the local SQLite database
npm run db:seed        # 12 products, admin account, sample reviews
npm run dev            # http://localhost:3000
```

The **admin login** is whatever `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
say in your `.env` (this repo's `.env` was generated with a random password —
open it to see the credentials, and change them after first login).

Checkout works immediately with **Cash on Delivery** and **bank transfer** —
no payment provider needed. Order lifecycle:

| Method | Placed as | Then |
|---|---|---|
| COD | `CONFIRMED` (stock reserved) | admin → `SHIPPED` → `DELIVERED` (rider collects cash) |
| Bank transfer | `PENDING` (stock reserved) | customer sends receipt on WhatsApp → admin marks `PAID` |
| Card | `PENDING` | payment webhook marks `PAID` and decrements stock |
| PayFast | `PENDING` | verified return callback marks `PAID` and decrements stock |

### Online payments

**PayFast (Pakistan)** is integrated end-to-end (`src/lib/payfast.ts`):
token fetch → hosted-checkout redirect → hash-verified return at
`/api/payments/payfast/return`. To go live, sign up at
[gopayfast.com](https://gopayfast.com), then set `PAYFAST_MERCHANT_ID`,
`PAYFAST_SECURED_KEY` and (for production) `PAYFAST_BASE_URL` — the default
base URL is the sandbox host `https://ipguat.apps.net.pk`. Confirm the field
names against the integration guide PayFast sends at onboarding; the return
verdicts are deliberately conservative (an unverifiable "success" stays
PENDING for the admin to confirm before shipping).

**Cards** — Stripe doesn't onboard Pakistan-based merchants directly. Options:
- Keep COD + bank transfer + PayFast (PayFast itself processes cards);
- Use Stripe via a foreign-registered entity: set `STRIPE_SECRET_KEY` and
  `STRIPE_WEBHOOK_SECRET` (test card `4242 4242 4242 4242`; local webhook via
  `stripe listen --forward-to localhost:3000/api/webhooks/stripe`).

In development with no gateway keys, Card and PayFast both complete orders in
clearly-marked demo mode so the whole flow can be exercised. In production
without keys they refuse with a friendly 503 instead — unpaid orders are never
silently completed.

## Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | `file:./dev.db` locally; a Postgres URL in production |
| `AUTH_SECRET` | ≥32-char random string signing session JWTs. Rotate to log everyone out. |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL (Stripe redirects, sitemap, metadata) |
| `STRIPE_SECRET_KEY` | Stripe secret key (empty ⇒ demo checkout) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret |
| `PAYFAST_MERCHANT_ID` / `PAYFAST_SECURED_KEY` | PayFast (Pakistan) merchant credentials (empty ⇒ demo checkout) |
| `PAYFAST_BASE_URL` | PayFast host; defaults to the sandbox `https://ipguat.apps.net.pk` |
| `RESEND_API_KEY` | Resend API key for transactional email (empty ⇒ emails are logged, not sent) |
| `EMAIL_FROM` | Sender address on a Resend-verified domain, e.g. `Ruby Choice <orders@rubychoice.com>` |
| `ORDER_ALERT_EMAIL` | Optional — receives a heads-up on every new order |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Admin account created by the seed |

## API overview

Public: `GET /api/products` (q, family, gender, sort, page) · `GET /api/products/[slug]` ·
`GET /api/products/[slug]/reviews` · `POST /api/coupons` (discount preview) ·
`POST /api/newsletter` · `POST /api/contact`

Authenticated: `POST /api/auth/register|login|logout` · `GET /api/auth/me` ·
`GET|POST /api/wishlist` · `POST /api/products/[slug]/reviews` · `POST /api/checkout` ·
`GET /api/orders`

Admin (role checked against DB): `GET|POST /api/admin/products` ·
`PATCH|DELETE /api/admin/products/[id]` · `PATCH /api/admin/orders/[id]` ·
`GET|POST /api/admin/coupons` · `PATCH|DELETE /api/admin/coupons/[id]`

Stripe: `POST /api/webhooks/stripe` (signature-verified).

## Security posture

Verified end-to-end against the running server (31 automated checks):

- **XSS** — strict Content-Security-Policy with a **per-request nonce +
  `strict-dynamic`** (set in [`src/proxy.ts`](src/proxy.ts)); no `unsafe-eval`
  in production; React output encoding (a `<script>` injected through a review
  renders escaped).
- **Injection** — all queries through Prisma (parameterized); all input parsed
  with Zod schemas (length caps, format checks) before touching the DB.
- **Auth** — bcrypt (cost 12, 72-byte cap), JWT sessions in `httpOnly` /
  `Secure` / `SameSite=Lax` cookies; generic "invalid email or password";
  dummy-hash compare to blunt timing-based user enumeration; login/registration
  rate-limited per IP and per email.
- **CSRF** — SameSite=Lax cookies plus an Origin check on every state-changing
  endpoint (cross-origin POST → 403).
- **Authorization** — `/account`/`/admin` gated in the proxy, then re-checked
  server-side; the ADMIN role is read from the **database** on every admin
  request, never trusted from the JWT.
- **Payment integrity** — the client sends only product ids and quantities;
  prices and totals are always computed from the database (price tampering is
  ignored). Card data never touches this server (gateway-hosted checkout);
  webhooks are signature-verified. In production, card checkout **refuses**
  (503) rather than silently completing when no gateway is configured.
- **Headers** — HSTS (preload), `X-Frame-Options: DENY` + `frame-ancestors 'none'`,
  `nosniff`, restrictive `Permissions-Policy`, `Referrer-Policy`,
  `X-Powered-By` removed.
- **Supply chain** — `npm audit`: **0 vulnerabilities** (transitive postcss
  advisory fixed via `overrides`).
- Rate limiting on login, register, checkout, reviews, newsletter, contact.
- Secrets only in `.env` (gitignored); no secrets in client bundles.

**Known limitations (documented, not hidden):**
- The rate limiter is in-memory: perfect for one server/container, best-effort
  on serverless (each instance counts separately). For hard guarantees swap
  the store in [`src/lib/rate-limit.ts`](src/lib/rate-limit.ts) for
  Redis/Upstash — call sites stay identical.
- Logout clears the cookie; the JWT itself stays valid until expiry (7 days).
  For instant revocation, add a session table or token denylist.
- Password reset is implemented (email link, 1-hour single-use token). Email
  *verification* on signup is not yet enforced.
- Order emails (confirmation/shipped/delivered) go out via Resend. An SMS/
  WhatsApp confirmation for COD is still a worthwhile future add to further
  reduce fake-order rates.
- COD fake orders are a known cost in Pakistani e-commerce; phone capture +
  the courier confirmation call are the first line of defense. Consider
  requiring advance payment for very large orders.
- Registration reveals whether an email exists (deliberate UX trade-off,
  rate-limited).
- Stock is checked at checkout and decremented at payment; a burst of
  simultaneous buyers could briefly oversell a low-stock item.

## Product photography

The images in `public/products/photos/` are **free Unsplash placeholder
photos**. Several show recognizable designer bottles — fine for a demo, but
**replace them with your own product photography before launching**: selling
under someone else's trade dress is a trademark problem. Drop your photos into
that folder with the same file names (or update each product's image path in
the admin panel) and you're done. `scripts/download-photos.mjs` documents how
the placeholders were fetched.

## Going live (Vercel + Hostinger domain + PayFast)

The domain stays registered at Hostinger; the app runs on Vercel's free tier
(HTTPS automatic); the database moves to Postgres (Neon free tier) because
SQLite doesn't persist on serverless. Git is **not** required — the Vercel
CLI deploys the folder directly.

**One-time accounts (browser):**
1. Create a free account at <https://vercel.com> and run `npx vercel login`
   once in a terminal on this machine.
2. Create a free Postgres database at <https://neon.tech> → copy both the
   **pooled** connection string (for the app) and the **direct** one (for
   schema pushes).
3. Start PayFast merchant onboarding at <https://gopayfast.com> (needs
   CNIC/NTN + business bank account; approval takes a few days). You receive
   `MERCHANT_ID`, `SECURED_KEY`, and the production base URL.

**Deploy (from the project folder):**
1. In `prisma/schema.prisma`: `provider = "postgresql"`, and add
   `directUrl = env("DIRECT_DATABASE_URL")` under `url`.
2. Create schema + seed the production DB once:
   ```powershell
   $env:DATABASE_URL="<direct-neon-url>"; npx prisma db push; npm run db:seed
   ```
3. `npx vercel` (first run links the project), then set env vars —
   `DATABASE_URL` (pooled), `DIRECT_DATABASE_URL` (direct), a **newly
   generated** `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`,
   `SEED_ADMIN_*`, and the `PAYFAST_*` values once onboarding completes —
   via `npx vercel env add <NAME> production`. Then `npx vercel --prod`.

**Point the Hostinger domain at Vercel:**
1. `npx vercel domains add yourdomain.com` (and `www.yourdomain.com`).
2. In Hostinger hPanel → **Domains → yourdomain.com → DNS / Name Servers →
   DNS records**: set the apex `A` record to `76.76.21.21` and the `www`
   `CNAME` to `cname.vercel-dns.com` (delete conflicting old A/CNAME records,
   e.g. Hostinger's parking records). DNS propagates in minutes to a few
   hours; Vercel then issues the HTTPS certificate automatically.

**PayFast go-live checklist:** set `PAYFAST_MERCHANT_ID`, `PAYFAST_SECURED_KEY`
and `PAYFAST_BASE_URL` (production host from your onboarding pack) in Vercel
env vars; confirm the checkout field names against the integration guide
PayFast sends you; place a small real order end-to-end before announcing.
Also replace the placeholder bank IBAN / WhatsApp number / brand copy in
[`src/lib/site.ts`](src/lib/site.ts) before launch.

Self-hosting instead? `npm run build && npm run start` behind any HTTPS
reverse proxy (Caddy/nginx) works as-is; SQLite is fine there if you back
up `prisma/dev.db`.

## Project structure

```
prisma/schema.prisma       Data model (User, Product, Review, Order, …)
prisma/seed.js             Catalog + admin + sample reviews
src/proxy.ts               CSP nonce + auth gate (Next 16 proxy)
next.config.ts             Security headers
src/lib/                   db, auth (JWT/bcrypt), validation (Zod),
                           rate-limit, http (CSRF/errors), site config
src/app/                   Pages: home, shop, product, cart, checkout,
                           login/register, account, admin, about, contact
src/app/api/               REST endpoints (see API overview)
src/components/            Header, Footer, CartProvider, ProductCard, forms…
scripts/generate-art.mjs   Regenerates the SVG bottle artwork
```
