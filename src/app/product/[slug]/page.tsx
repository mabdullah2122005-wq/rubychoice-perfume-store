import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { site } from "@/lib/site";
import { formatPrice, formatDate } from "@/lib/format";
import ProductBuyBox from "@/components/ProductBuyBox";
import ProductCard from "@/components/ProductCard";
import ReviewForm from "@/components/ReviewForm";
import StarRating from "@/components/StarRating";
import RecentlyViewed, { RecentlyViewedTracker } from "@/components/RecentlyViewed";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await db.product.findUnique({
    where: { slug },
    select: { name: true, tagline: true, published: true },
  });
  if (!product || !product.published) return { title: "Not found" };
  return { title: product.name, description: product.tagline };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
  if (!product || !product.published) notFound();

  const user = await getCurrentUser();
  const related = await db.product.findMany({
    where: { published: true, scentFamily: product.scentFamily, id: { not: product.id } },
    take: 3,
    include: { reviews: { select: { rating: true } } },
  });

  const ownReview = user
    ? (product.reviews.find((r) => r.userId === user.id) ?? null)
    : null;
  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
      : null;

  const notes = [
    { label: "Top notes", value: product.notesTop },
    { label: "Heart notes", value: product.notesHeart },
    { label: "Base notes", value: product.notesBase },
  ];

  // Product rich-result markup (price, stock, star rating in search results).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.tagline,
    image: `${site.url}${product.image}`,
    sku: product.slug,
    category: `${product.productType} — ${product.scentFamily}`,
    brand: { "@type": "Brand", name: site.name },
    offers: {
      "@type": "Offer",
      url: `${site.url}/product/${product.slug}`,
      priceCurrency: "PKR",
      price: (product.priceCents / 100).toFixed(2),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(avgRating !== null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(avgRating.toFixed(1)),
            reviewCount: product.reviews.length,
          },
        }
      : {}),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <nav className="mb-6 text-xs text-ink-soft" aria-label="Breadcrumb">
        <Link href="/shop" className="hover:text-gold">Shop</Link>
        <span className="mx-2">/</span>
        <Link href={`/shop?family=${product.scentFamily}`} className="hover:text-gold">
          {product.scentFamily}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-parchment bg-cream-dark md:sticky md:top-28 md:self-start">
          <Image
            src={product.image}
            alt={`${product.name} bottle`}
            fill
            preload
            sizes="(max-width: 768px) 92vw, 560px"
            className="object-cover"
          />
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        <div>
          <div className="flex flex-wrap gap-2">
            <span className="chip">{product.productType}</span>
            <span className="chip">{product.scentFamily}</span>
            <span className="chip">{product.gender}</span>
          </div>
          <h1 className="mt-4 font-serif text-4xl md:text-5xl">{product.name}</h1>
          <p className="mt-2 font-serif text-xl italic text-ink-soft">{product.tagline}</p>

          {avgRating !== null && (
            <div className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
              <StarRating value={avgRating} />
              <span>
                {avgRating.toFixed(1)} · {product.reviews.length} review
                {product.reviews.length === 1 ? "" : "s"}
              </span>
            </div>
          )}

          <ProductBuyBox
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              image: product.image,
              stock: product.stock,
              sizeMl: product.sizeMl,
              priceCents: product.priceCents,
              compareAtCents: product.compareAtCents,
              sizes: product.sizes,
            }}
          />

          <a
            href={`https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(
              `Assalam o Alaikum! I'd like to order ${product.name} (${site.url}/product/${product.slug})`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 rounded-full border border-[#128C7E]/50 px-6 py-3 text-xs uppercase tracking-[0.2em] text-[#128C7E] transition hover:bg-[#25D366]/10"
          >
            <svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor" aria-hidden="true">
              <path d="M16 2.7C8.7 2.7 2.8 8.6 2.8 15.9c0 2.3.6 4.6 1.8 6.6L2.7 29.3l7-1.8c1.9 1 4.1 1.6 6.3 1.6 7.3 0 13.2-5.9 13.2-13.2S23.3 2.7 16 2.7zm0 24.1c-2 0-3.9-.5-5.6-1.5l-.4-.2-4.1 1.1 1.1-4-.3-.4c-1.1-1.8-1.7-3.8-1.7-5.9C5 9.8 9.9 4.9 16 4.9s11 4.9 11 11-4.9 10.9-11 10.9z" />
            </svg>
            Order on WhatsApp
          </a>

          <div className="prose-brand mt-8 text-sm leading-relaxed text-ink-soft">
            {product.description.split("\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          <dl className="mt-8 divide-y divide-parchment border-y border-parchment">
            {notes.map((n) => (
              <div key={n.label} className="flex py-3">
                <dt className="w-32 shrink-0 text-xs uppercase tracking-widest text-gold-dark">
                  {n.label}
                </dt>
                <dd className="text-sm">{n.value}</dd>
              </div>
            ))}
          </dl>

          <ul className="mt-6 space-y-1 text-xs text-ink-soft">
            <li>· Cash on Delivery across Pakistan</li>
            <li>· Free shipping on orders over {formatPrice(site.freeShippingThresholdCents)}</li>
            <li>· {site.deliveryNote}</li>
            <li>· 7-day returns on unopened bottles</li>
          </ul>
        </div>
      </div>

      {/* Reviews — the list appears once a customer leaves one; the form is
          always available (no account required). */}
      <section className="mt-16 border-t border-parchment pt-10">
        <h2 className="font-serif text-3xl">
          {product.reviews.length > 0
            ? `Impressions (${product.reviews.length})`
            : "Be the first to review"}
        </h2>
        {avgRating !== null && (
          <div className="mt-2 flex items-center gap-2 text-sm text-ink-soft">
            <StarRating value={avgRating} />
            <span>
              {avgRating.toFixed(1)} out of 5 · {product.reviews.length} review
              {product.reviews.length === 1 ? "" : "s"}
            </span>
          </div>
        )}
        <div className={`mt-6 grid gap-10 ${product.reviews.length > 0 ? "md:grid-cols-2" : ""}`}>
          {product.reviews.length > 0 && (
            <div className="space-y-6">
              {product.reviews.map((review) => (
                <article key={review.id} className="card-panel p-4">
                  <div className="flex items-center justify-between">
                    <StarRating value={review.rating} />
                    <span className="text-xs text-ink-soft">{formatDate(review.createdAt)}</span>
                  </div>
                  <h3 className="mt-2 font-serif text-lg">{review.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{review.body}</p>
                  <p className="mt-2 text-xs uppercase tracking-widest text-gold-dark">
                    {review.authorName}
                  </p>
                </article>
              ))}
            </div>
          )}
          <div>
            <ReviewForm
              slug={product.slug}
              loggedIn={Boolean(user)}
              existing={
                ownReview
                  ? { rating: ownReview.rating, title: ownReview.title, body: ownReview.body }
                  : null
              }
            />
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16 border-t border-parchment pt-10">
          <h2 className="font-serif text-3xl">From the same family</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <RecentlyViewedTracker
        item={{
          slug: product.slug,
          name: product.name,
          image: product.image,
          priceCents: product.priceCents,
        }}
      />
      <RecentlyViewed excludeSlug={product.slug} />
    </div>
  );
}
