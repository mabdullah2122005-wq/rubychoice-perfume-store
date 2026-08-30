# PROJECT MAP — Ruby Choice (perfume-store)

> **Read this before searching the codebase.** It is a complete index of every
> source file and the main flows. Use it to jump straight to the 1–3 files you
> need instead of grepping. If something here is wrong or missing, fix this file
> in the same change — a stale map is worse than none.

Perfume e-commerce storefront. **LIVE** at rubychoice.com (Vercel + Neon Postgres).
Currency is PKR; all money is stored as **integer paisa** in `*Cents` fields.

## Stack

Next.js 16.2.10 App Router · React 19.2 · TypeScript · Tailwind v4 · Prisma 6.19
→ Neon Postgres · custom JWT auth (`jose` + `bcryptjs`, no NextAuth) ·
Stripe + PayFast · Resend email.

## Commands

| | |
|---|---|
| `npm run dev` | dev server on :3000 |
| `npm run build` | production build (also the typecheck — there is no separate `tsc` script) |
| `npm run lint` | eslint |
| `npm run db:push` | push schema to Neon (needs `DIRECT_DATABASE_URL`) |
| `npm run db:seed` | `node prisma/seed.js` — products + admin user |
| `npm run db:studio` | Prisma Studio |

`postinstall` runs `prisma generate` automatically.

## Data model — `prisma/schema.prisma` (168 lines, read it for field detail)

- **User** — email/passwordHash, `role` = `"CUSTOMER" | "ADMIN"` (plain string, no enum)
- **Product** — slug, scentFamily, notesTop/Heart/Base, `priceCents`, `sizeMl`, `sizes` (JSON array of extra size options), stock, featured, published
- **Review** — guest-allowed; `@@unique([userId, productId])` limits logged-in users to one (NULL userIds are distinct in Postgres, so guests aren't capped)
- **WishlistItem** — logged-in favourites; guests use localStorage via `FavouritesProvider`
- **Order / OrderItem** — `orderNumber` autoincrement (shown as `RC-…`); status `PENDING|CONFIRMED|PAID|SHIPPED|DELIVERED|CANCELLED`; paymentMethod `COD|BANK|CARD`; OrderItem snapshots name/price at purchase time
- **Coupon** — `kind` = `PERCENT|FIXED`, usedCount vs maxUses
- **StoreSettings** — **singleton, id `"main"`**; `mode` = `LIVE|COMING_SOON|MAINTENANCE` + cover copy + announcement
- **NewsletterSubscriber**, **PasswordResetToken** (sha-256 of emailed token), **StockNotification** (back-in-stock waitlist), **ContactMessage**

## Main flows — follow these file chains

**Request pipeline** → [src/proxy.ts](src/proxy.ts) runs on every non-asset request:
nonce-based CSP, auth gate for `/account` + `/admin`, sets `x-nonce` and
`x-pathname` headers, redirects `/account/wishlist` → `/favourites`.
*(In Next 16 `proxy.ts` is what `middleware.ts` used to be.)*

**Auth** → [src/lib/auth.ts](src/lib/auth.ts) (JWT sign/verify, `SESSION_COOKIE`) ·
`src/app/api/auth/{login,register,logout,me,forgot,reset}/route.ts` ·
UI: [src/components/AuthForm.tsx](src/components/AuthForm.tsx), `ForgotPasswordForm.tsx`, `ResetPasswordForm.tsx`

**Cart** → [src/components/CartProvider.tsx](src/components/CartProvider.tsx) (client context + localStorage) →
`CartDrawer.tsx`, `AddToCartButton.tsx`, [src/app/cart/page.tsx](src/app/cart/page.tsx)

**Checkout** → [src/app/checkout/page.tsx](src/app/checkout/page.tsx) →
[src/components/CheckoutForm.tsx](src/components/CheckoutForm.tsx) *(513 lines — the biggest file here)* →
[src/app/api/checkout/route.ts](src/app/api/checkout/route.ts) *(286 lines, order creation + provider branch)* →
either `api/webhooks/stripe/route.ts` or `api/payments/payfast/return/route.ts` →
[src/app/checkout/success/page.tsx](src/app/checkout/success/page.tsx) + `ClearCartOnSuccess.tsx`.
Payment helpers: [src/lib/payfast.ts](src/lib/payfast.ts), coupons in [src/lib/coupons.ts](src/lib/coupons.ts).
**With no Stripe/PayFast keys set, checkout falls back to demo/COD mode.**

**Storefront mode** → [src/lib/settings.ts](src/lib/settings.ts) reads the StoreSettings singleton;
[src/components/CoverPage.tsx](src/components/CoverPage.tsx) + `LaunchCountdown.tsx` render over the site when
mode ≠ LIVE; [src/app/layout.tsx](src/app/layout.tsx) decides using the `x-pathname` header.

**Admin** → [src/app/admin/layout.tsx](src/app/admin/layout.tsx) is the ADMIN role guard. Pages:
`admin/page.tsx` (dashboard), `admin/products` (+`new`, `[id]/edit`), `admin/orders`, `admin/coupons`, `admin/settings`.
Admin components live in [src/components/admin/](src/components/admin/) — `AdminDashboardView.tsx` (dashboard analytics UI),
`ProductForm.tsx` (248), `SettingsForm.tsx` (190), `CouponForm.tsx`, `OrderManager.tsx`, `OrderStatusSelect.tsx`,
`CouponActions.tsx`, `DeleteProductButton.tsx`. Dashboard data: [src/lib/admin-dashboard.ts](src/lib/admin-dashboard.ts).
API: `api/admin/{products,orders,coupons,settings}/route.ts` (+ `[id]` variants).

**Emails** → [src/lib/email.ts](src/lib/email.ts) (313 lines — all templates: order confirmation,
shipped, reset password, back-in-stock, contact + order alerts). Resend; no key = no-op.

## Directory reference

**`src/lib/`** — `db.ts` (Prisma singleton) · `auth.ts` · `admin-dashboard.ts` (admin KPI queries) · `email.ts` · `payfast.ts` ·
`coupons.ts` · `settings.ts` · `site.ts` (site URL/meta) · `validation.ts` (169 lines, all zod schemas) ·
`format.ts` (price/date formatting) · `http.ts` (fetch + response helpers) · `sizes.ts` (size-option logic) ·
`rate-limit.ts` (in-memory limiter)

**`src/app/`** — storefront: `page.tsx` (304, homepage) · `shop` · `product/[slug]` · `cart` · `checkout` ·
`favourites` · `account` · `track` (order tracking) · `login`/`register`/`forgot`/`reset` ·
content pages: `about`, `contact`, `faq`, `shipping`, `returns`, `privacy`, `terms` ·
SEO: `sitemap.ts`, `robots.ts` · `not-found.tsx` · `error.tsx` (root error boundary, added)
· `loading.tsx` skeletons for `home`, `shop`, `product`, `checkout`, `favourites`, and
the three heaviest admin pages (`admin`, `admin/products`, `admin/orders`) ·
`globals.css` (250 lines, all custom CSS/theme) · `admin/not-found.tsx` for 404s inside admin

**`src/app/api/`** — `products` (+`[slug]`, `[slug]/reviews`, `[slug]/notify`, `by-ids`) ·
`orders` (+`track`) · `checkout` · `coupons` · `wishlist` · `newsletter` · `contact` ·
`auth/*` · `admin/*` · `webhooks/stripe` · `payments/payfast/return`

**`src/components/`** — `Header.tsx` (216) · `Footer.tsx` · `SearchBar.tsx` (249) ·
`ProductCard.tsx` · `ProductBuyBox.tsx` · `InfiniteProductGrid.tsx` · `ShopFilters.tsx` ·
`HeroSlider.tsx` · `StorySlider.tsx` · `Carousel.tsx` · `ReviewForm.tsx` · `StarRating.tsx` ·
`FavouriteButton.tsx` / `FavouritesProvider.tsx` / `FavouritesGrid.tsx` / `FavouritesReminder.tsx` ·
`RecentlyViewed.tsx` · `FreeShippingBar.tsx` · `NewsletterForm.tsx` · `BackInStockForm.tsx` ·
`ContactForm.tsx` · `TrackOrderForm.tsx` (196) · `WhatsAppButton.tsx` · `WelcomeIntro.tsx` ·
`PolicyLayout.tsx` · `Skeleton.tsx` (loading primitives shared by `loading.tsx`) ·
`ToastProvider.tsx` + `useToast()` (monochrome toast layer wrapped in `app/layout.tsx`)

**`scripts/`** — `download-photos.mjs`, `generate-art.mjs` (one-off asset tooling, not part of the app)

## Environment variables

`DATABASE_URL` (pooled Neon URL, runtime) · `DIRECT_DATABASE_URL` (direct URL, for `db push`) ·
`AUTH_SECRET` · `NEXT_PUBLIC_SITE_URL` · `STRIPE_SECRET_KEY` · `STRIPE_WEBHOOK_SECRET` ·
`PAYFAST_MERCHANT_ID` · `PAYFAST_SECURED_KEY` · `PAYFAST_BASE_URL` ·
`RESEND_API_KEY` · `EMAIL_FROM` · `ORDER_ALERT_EMAIL` · `SEED_ADMIN_EMAIL` · `SEED_ADMIN_PASSWORD`

⚠️ [.env.example](.env.example) lists every variable — Neon (pooled + direct
URLs), Stripe, PayFast, Resend, and seed admin credentials — so trust it
and `.env`, not earlier notes about SQLite.

## Don't read these

- `node_modules/`, `.next/`, `public/products/` — no answers in there
- `Ruby-Choice-Report.html` (375 lines) — a generated one-off report, not app code
