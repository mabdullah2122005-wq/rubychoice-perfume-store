import Link from "next/link";
import Image from "next/image";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { site } from "@/lib/site";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import StarRating from "@/components/StarRating";
import Carousel from "@/components/Carousel";
import HeroSlider from "@/components/HeroSlider";
import RecentlyViewed from "@/components/RecentlyViewed";
import FavouritesReminder from "@/components/FavouritesReminder";
import StorySlider from "@/components/StorySlider";

const heroSlides = [
  { src: "/hero.jpg", alt: "A collection of vintage perfume flacons" },
  { src: "/products/photos/noir-oud.jpg", alt: "Noir Oud — smoked oud eau de parfum" },
  { src: "/products/photos/gulab-e-lahore.jpg", alt: "Desi Gulab — traditional rose attar" },
  { src: "/products/photos/ambre-nuit.jpg", alt: "Ambre Nuit — warm amber eau de parfum" },
];

const cardInclude = { reviews: { select: { rating: true } } };

// Carousel item widths: ~1.5 cards visible on phones (the peek invites a
// swipe), settling into fixed columns on desktop.
const productItem =
  "w-[68vw] min-[420px]:w-[46vw] sm:w-[38vw] md:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)]";
const reviewItem =
  "w-[82vw] sm:w-[55vw] md:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]";

// Primary categories: type (perfumes / attars) and who it's for.
const mainCategories = [
  { label: "Perfumes", note: "Eau de parfum sprays", href: "/shop?type=Eau+de+Parfum", image: "/products/photos/fleur-blanche.jpg" },
  { label: "Attars", note: "Traditional oil concentrates", href: "/shop?type=Attar+Oil", image: "/products/photos/mitti-attar.jpg" },
  { label: "For Him", note: "Bold, woody, fresh", href: "/shop?gender=Men", image: "/products/photos/noir-oud.jpg" },
  { label: "For Her", note: "Floral, sweet, powdery", href: "/shop?gender=Women", image: "/products/photos/rose-poudre.jpg" },
  { label: "Unisex", note: "For everyone", href: "/shop?gender=Unisex", image: "/products/photos/marine-sel.jpg" },
];

/**
 * Best sellers ranked by actual bottles sold (cancelled orders excluded).
 * A young store has little sales data, so the list is topped up with the
 * most-reviewed products to always fill the row.
 */
async function getBestSellers(count: number): Promise<ProductCardData[]> {
  const sold = await db.orderItem.groupBy({
    by: ["productId"],
    where: { productId: { not: null }, order: { status: { not: "CANCELLED" } } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: count * 2,
  });
  const soldIds = sold
    .map((g) => g.productId)
    .filter((id): id is string => id !== null);

  const soldProducts = soldIds.length
    ? await db.product.findMany({
        where: { id: { in: soldIds }, published: true },
        include: cardInclude,
      })
    : [];
  const ranked = soldIds
    .map((id) => soldProducts.find((p) => p.id === id))
    .filter((p): p is (typeof soldProducts)[number] => Boolean(p))
    .slice(0, count);

  if (ranked.length < count) {
    const fill = await db.product.findMany({
      where: { published: true, id: { notIn: ranked.map((p) => p.id) } },
      orderBy: [{ reviews: { _count: "desc" } }, { createdAt: "desc" }],
      take: count - ranked.length,
      include: cardInclude,
    });
    ranked.push(...fill);
  }
  return ranked;
}

function SectionHeader({
  eyebrow,
  title,
  link,
}: {
  eyebrow: string;
  title: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gold">{eyebrow}</p>
        <h2 className="mt-1 font-serif text-2xl sm:text-4xl">{title}</h2>
      </div>
      {link && (
        <Link href={link.href} className="nav-link text-sm text-gold">
          {link.label}
        </Link>
      )}
    </div>
  );
}

// Homepage data is cached in Vercel's Data Cache (fast, and resilient to
// database cold starts). Admin catalog changes call revalidateTag("catalog"),
// so edits show immediately; otherwise it refreshes at most once a minute.
const getHomeData = unstable_cache(
  async () => {
    const [featured, arrivals, bestSellers, testimonials] = await Promise.all([
      db.product.findMany({
        where: { published: true, featured: true },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: cardInclude,
      }),
      db.product.findMany({
        where: { published: true, featured: false },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: cardInclude,
      }),
      getBestSellers(8),
      db.review.findMany({
        where: { rating: { gte: 4 } },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { product: { select: { name: true, slug: true } } },
      }),
    ]);
    return { featured, arrivals, bestSellers, testimonials };
  },
  ["home-data-v1"],
  { revalidate: 60, tags: ["catalog"] }
);

export default async function HomePage() {
  const { featured, arrivals, bestSellers, testimonials } = await getHomeData();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* subtle ambient wash */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-cream-dark to-transparent" />

        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 md:gap-12 md:py-24">
          <div className="animate-fade-up">
            <p className="chip">Maison de parfum · Pakistan</p>
            <h1 className="mt-6 font-serif text-4xl leading-[1.1] sm:text-5xl md:text-6xl">
              Fragrances composed{" "}
              <em className="text-gradient-gold">to be remembered</em>
            </h1>
            <p className="mt-5 max-w-md leading-relaxed text-ink-soft">
              Faithful impressions of the world&apos;s most-loved fragrances,
              alongside our own signature scents — as eaux de parfum and
              traditional attars, bottled by hand in our atelier.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-primary">
                Shop the collection
              </Link>
              <Link href="/shop?type=Attar+Oil" className="btn-outline">
                Explore attars
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-ink-soft">
              <li className="flex items-center gap-1.5">
                <span className="text-gold">✓</span> Cash on Delivery
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-gold">✓</span> Free shipping over Rs 5,000
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-gold">✓</span> 2–4 day delivery
              </li>
            </ul>
          </div>
          <div className="animate-fade-up md:pl-8">
            <div className="relative mx-auto max-w-sm md:max-w-md">
              <HeroSlider slides={heroSlides} />
            </div>
          </div>
        </div>
      </section>

      {/* Saved-for-later reminder (only for returning shoppers with favourites) */}
      <FavouritesReminder />

      {/* Shop by category — perfumes / attars / him / her */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <SectionHeader eyebrow="The collections" title="Shop by category" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {mainCategories.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className="group relative block aspect-[4/5] overflow-hidden rounded-2xl border border-parchment bg-cream-dark"
            >
              <Image
                src={cat.image}
                alt=""
                fill
                sizes="(max-width: 640px) 46vw, (max-width: 1024px) 24vw, 280px"
                className="object-cover transition duration-700 group-hover:scale-[1.06]"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent"
              />
              <span className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                <span className="block font-serif text-xl text-white sm:text-2xl">{cat.label}</span>
                <span className="mt-0.5 block text-[9px] uppercase tracking-[0.2em] text-white/80 sm:text-[11px]">
                  {cat.note}
                </span>
              </span>
            </Link>
          ))}
        </div>

        {/* Fragrance families */}
        <p className="mt-8 text-center text-xs uppercase tracking-[0.3em] text-ink-soft">
          Or explore by fragrance family
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {site.scentFamilies.map((family) => (
            <Link
              key={family}
              href={`/shop?family=${family}`}
              className="rounded-full border border-parchment bg-surface px-4 py-2 text-sm transition hover:border-ink hover:bg-ink hover:text-cream"
            >
              {family}
            </Link>
          ))}
        </div>
      </section>

      {/* Best sellers */}
      {bestSellers.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 sm:pb-16">
          <SectionHeader
            eyebrow="Most loved"
            title="Best sellers"
            link={{ href: "/shop", label: "View all →" }}
          />
          <Carousel label="Best sellers" itemClassName={productItem}>
            {bestSellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </Carousel>
        </section>
      )}

      {/* Brand story — smooth auto-playing slider (swipe / drag) */}
      <StorySlider />

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <SectionHeader
            eyebrow="The edit"
            title="Signature compositions"
            link={{ href: "/shop", label: "View all →" }}
          />
          <Carousel label="Signature compositions" itemClassName={productItem}>
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </Carousel>
        </section>
      )}

      {/* Word of mouth */}
      {testimonials.length > 0 && (
        <section className="border-y border-parchment bg-cream-dark">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
            <SectionHeader eyebrow="Word of mouth" title="What customers say" />
            <Carousel label="Customer reviews" itemClassName={reviewItem}>
              {testimonials.map((review) => (
                <figure key={review.id} className="card-panel flex h-full flex-col p-5 sm:p-6">
                  <StarRating value={review.rating} />
                  <blockquote className="mt-3 flex-1">
                    <p className="font-serif text-lg italic leading-snug">
                      “{review.title}”
                    </p>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">
                      {review.body}
                    </p>
                  </blockquote>
                  <figcaption className="mt-4 text-xs text-ink-soft">
                    <span className="uppercase tracking-widest">{review.authorName}</span>
                    {" · on "}
                    <Link
                      href={`/product/${review.product.slug}`}
                      className="text-gold-dark hover:underline"
                    >
                      {review.product.name}
                    </Link>
                  </figcaption>
                </figure>
              ))}
            </Carousel>
          </div>
        </section>
      )}

      {/* New arrivals */}
      {arrivals.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <SectionHeader
            eyebrow="Just bottled"
            title="New arrivals"
            link={{ href: "/shop?sort=new", label: "View all →" }}
          />
          <Carousel label="New arrivals" itemClassName={productItem}>
            {arrivals.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </Carousel>
        </section>
      )}

      {/* Only renders for shoppers who have browsed products before */}
      <RecentlyViewed />
    </div>
  );
}
