// Seeds the catalog (eaux de parfum + attars), the admin account, and sample
// reviews. Prices are in paisa (1/100 PKR). Run with: npm run db:seed
const { readFileSync, existsSync } = require("node:fs");
const { join } = require("node:path");
const { PrismaClient } = require("@prisma/client");
const { hashSync } = require("bcryptjs");
const { randomBytes } = require("node:crypto");

// Minimal .env loader so `node prisma/seed.js` works without extra deps.
function loadEnv() {
  const file = join(__dirname, "..", ".env");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2];
  }
}
loadEnv();

const db = new PrismaClient();

const EDP = "Eau de Parfum";
const ATTAR = "Attar Oil";

const products = [
  {
    slug: "aurore",
    name: "Aurore",
    tagline: "First light over a field of immortelle",
    description:
      "Aurore opens the way a summer morning does — slowly, then all at once. Sun-dried immortelle and apricot skin warm into a heart of orange blossom honey, resting on a base of blond woods and skin musk.\nWear it when you want to be the warmest thing in the room.",
    productType: EDP,
    scentFamily: "Amber",
    gender: "Women",
    notesTop: "Apricot, immortelle, pink pepper",
    notesHeart: "Orange blossom, honey, heliotrope",
    notesBase: "Blond woods, skin musk, tonka",
    priceCents: 650000,
    compareAtCents: null,
    sizeMl: 50,
    stock: 24,
    image: "/products/photos/aurore.jpg",
    featured: true,
  },
  {
    slug: "noir-oud",
    name: "Noir Oud",
    tagline: "Smoked oud in a velvet-dark room",
    description:
      "Real oud, rested for a year, folded into Bulgarian rose and a whisper of saffron. Noir Oud is unapologetically opulent — a fragrance for evenings that intend to become stories.\nSillage is generous; apply with intent.",
    productType: EDP,
    scentFamily: "Woody",
    gender: "Unisex",
    notesTop: "Saffron, rum accord",
    notesHeart: "Oud, Bulgarian rose",
    notesBase: "Leather, patchouli, ambergris",
    priceCents: 1250000,
    compareAtCents: null,
    sizeMl: 50,
    stock: 12,
    image: "/products/photos/noir-oud.jpg",
    featured: true,
  },
  {
    slug: "fleur-blanche",
    name: "Fleur Blanche",
    tagline: "Jasmine picked before sunrise",
    description:
      "Our perfumer buys motia jasmine picked in the dark, so the flowers never learn it is day. Fleur Blanche pairs that jasmine with gardenia and a clean musk that reads like fresh linen.\nA white-flower soliflore with no soapiness — only petals.",
    productType: EDP,
    scentFamily: "Floral",
    gender: "Women",
    notesTop: "Neroli, green mandarin",
    notesHeart: "Motia jasmine, gardenia, tuberose",
    notesBase: "White musk, sandalwood",
    priceCents: 580000,
    compareAtCents: 680000,
    sizeMl: 50,
    stock: 30,
    image: "/products/photos/fleur-blanche.jpg",
    featured: true,
  },
  {
    slug: "vert-sauvage",
    name: "Vert Sauvage",
    tagline: "Crushed leaves, cold stream, wet stone",
    description:
      "Vert Sauvage is a walk off the marked path: galbanum and crushed fig leaf over vetiver and oakmoss, with a mineral note like river stone in spring. Bracing, green, quietly wild.\nThe one to wear with rolled sleeves.",
    productType: EDP,
    scentFamily: "Fresh",
    gender: "Men",
    notesTop: "Galbanum, fig leaf, bergamot",
    notesHeart: "Vetiver, cypress, geranium",
    notesBase: "Oakmoss, mineral accord, cedar",
    priceCents: 480000,
    compareAtCents: null,
    sizeMl: 50,
    stock: 40,
    image: "/products/photos/vert-sauvage.jpg",
    featured: false,
  },
  {
    slug: "ambre-nuit",
    name: "Ambre Nuit",
    tagline: "Amber the temperature of candlelight",
    description:
      "Labdanum, benzoin and vanilla-infused amber, warmed with cinnamon bark and a curl of incense smoke. Ambre Nuit sits close to the skin for the first hour, then blooms.\nWinter evenings were made for this bottle.",
    productType: EDP,
    scentFamily: "Amber",
    gender: "Unisex",
    notesTop: "Cinnamon bark, bitter orange",
    notesHeart: "Labdanum, incense, rose absolute",
    notesBase: "Benzoin, vanilla, ambergris",
    priceCents: 750000,
    compareAtCents: null,
    sizeMl: 50,
    stock: 18,
    image: "/products/photos/ambre-nuit.jpg",
    featured: true,
  },
  {
    slug: "rose-poudre",
    name: "Rose Poudrée",
    tagline: "A rose remembered, not photographed",
    description:
      "Not a fresh-cut rose — a rose from a memory: powdery, slightly lipstick-like, dusted with iris and violet. Rose Poudrée is vintage glamour without the museum air.\nSoft projection, remarkable persistence.",
    productType: EDP,
    scentFamily: "Floral",
    gender: "Women",
    notesTop: "Violet leaf, raspberry",
    notesHeart: "Damascena rose, iris butter, mimosa",
    notesBase: "Suede, white musk, cashmeran",
    priceCents: 550000,
    compareAtCents: null,
    sizeMl: 50,
    stock: 26,
    image: "/products/photos/rose-poudre.jpg",
    featured: false,
  },
  {
    slug: "agrume-dor",
    name: "Agrume d'Or",
    tagline: "Sunshine, bottled at noon",
    description:
      "Bergamot, cédrat and blood orange pressed over a neroli heart, with a bitter-green twist of petitgrain. Agrume d'Or is the espresso-at-the-counter of fragrances: quick, bright, essential.\nOur most reached-for summer bottle.",
    productType: EDP,
    scentFamily: "Citrus",
    gender: "Unisex",
    notesTop: "Bergamot, cédrat, blood orange",
    notesHeart: "Neroli, petitgrain, basil",
    notesBase: "Vetiver, light musk",
    priceCents: 420000,
    compareAtCents: null,
    sizeMl: 50,
    stock: 48,
    image: "/products/photos/agrume-dor.jpg",
    featured: false,
  },
  {
    slug: "bois-fume",
    name: "Bois Fumé",
    tagline: "Cedar smoked over juniper embers",
    description:
      "We smoke cedar over juniper before distillation — the result is a wood note with the memory of fire in it. Bois Fumé wraps that smoke in black pepper, iris root and a leather base.\nQuietly commanding; never loud.",
    productType: EDP,
    scentFamily: "Woody",
    gender: "Men",
    notesTop: "Black pepper, cardamom",
    notesHeart: "Smoked cedar, iris root",
    notesBase: "Leather, guaiac wood, vetiver",
    priceCents: 690000,
    compareAtCents: null,
    sizeMl: 50,
    stock: 20,
    image: "/products/photos/bois-fume.jpg",
    featured: false,
  },
  {
    slug: "lune-de-miel",
    name: "Lune de Miel",
    tagline: "Honeyed almond, warm brioche, soft skin",
    description:
      "A gourmand with restraint: toasted almond and acacia honey over a brioche accord that stays just this side of edible. Lune de Miel finishes in milky sandalwood and vanilla pod.\nComfort, composed.",
    productType: EDP,
    scentFamily: "Gourmand",
    gender: "Women",
    notesTop: "Toasted almond, bitter orange peel",
    notesHeart: "Acacia honey, brioche accord, jasmine",
    notesBase: "Milky sandalwood, vanilla pod, musk",
    priceCents: 560000,
    compareAtCents: null,
    sizeMl: 50,
    stock: 22,
    image: "/products/photos/lune-de-miel.jpg",
    featured: false,
  },
  {
    slug: "marine-sel",
    name: "Marine & Sel",
    tagline: "Salt on skin after a cold swim",
    description:
      "Not an aquatic — a coastal. Sea salt and ambergris over driftwood and sage, with a cool ozonic lift that smells like wind rather than water. Marine & Sel is the smell of the hour after the beach.\nUnisex, effortless, addictive.",
    productType: EDP,
    scentFamily: "Fresh",
    gender: "Unisex",
    notesTop: "Sea salt, ozonic accord, lemon",
    notesHeart: "Sage, driftwood, samphire",
    notesBase: "Ambergris, white musk, cedar",
    priceCents: 450000,
    compareAtCents: 520000,
    sizeMl: 50,
    stock: 35,
    image: "/products/photos/marine-sel.jpg",
    featured: false,
  },
  {
    slug: "violette-encre",
    name: "Violette Encre",
    tagline: "Violets pressed between book pages",
    description:
      "Ink, paper and violet — a fragrance for people who annotate the margins. Violette Encre pairs candied violet with an inky iris-woods accord and a trace of pipe tobacco.\nStrange in the best way; our cult favourite.",
    productType: EDP,
    scentFamily: "Floral",
    gender: "Unisex",
    notesTop: "Violet, aldehydes",
    notesHeart: "Iris, ink accord, cedar",
    notesBase: "Pipe tobacco, suede, musk",
    priceCents: 620000,
    compareAtCents: null,
    sizeMl: 50,
    stock: 15,
    image: "/products/photos/violette-encre.jpg",
    featured: false,
  },
  {
    slug: "cuir-safran",
    name: "Cuir Safran",
    tagline: "Saffron-stained leather, gilded edges",
    description:
      "A leather fragrance built like a well-made jacket: supple, lined with warmth. Saffron and rose oxide open onto a heart of birch-tar leather, finished with amber and a suggestion of dark honey.\nThe collection's most-requested restock.",
    productType: EDP,
    scentFamily: "Woody",
    gender: "Men",
    notesTop: "Saffron, rose oxide",
    notesHeart: "Birch-tar leather, cedar",
    notesBase: "Amber, dark honey, labdanum",
    priceCents: 850000,
    compareAtCents: null,
    sizeMl: 50,
    stock: 10,
    image: "/products/photos/cuir-safran.jpg",
    featured: false,
  },
  // ————— Traditional attars (alcohol-free concentrated oils) —————
  {
    slug: "oudh-kalakassi",
    name: "Oudh Kalakassi",
    tagline: "Deep aged oudh in the old style",
    description:
      "A traditional alcohol-free attar in the style of the old attar souks: aged oudh, dark and resinous, softened with a thread of rose and amber. One drop on the wrist wears from Fajr to midnight.\nComes in a 12 ml rollerball flacon.",
    productType: ATTAR,
    scentFamily: "Woody",
    gender: "Unisex",
    notesTop: "Aged oudh, saffron",
    notesHeart: "Rose, incense",
    notesBase: "Amber, musk",
    priceCents: 380000,
    compareAtCents: null,
    sizeMl: 12,
    stock: 15,
    image: "/products/photos/oudh-kalakassi.jpg",
    featured: true,
  },
  {
    slug: "mitti-attar",
    name: "Mitti Attar",
    tagline: "The first rain on summer earth",
    description:
      "Mitti attar is the scent of petrichor, captured the traditional way: baked earthen vessels hydro-distilled into sandalwood oil. It smells exactly like the first monsoon rain hitting hot ground.\nAlcohol-free, 12 ml rollerball. A heritage scent no synthetic has ever matched.",
    productType: ATTAR,
    scentFamily: "Fresh",
    gender: "Unisex",
    notesTop: "Petrichor, baked earth",
    notesHeart: "Wet clay, monsoon accord",
    notesBase: "Sandalwood oil",
    priceCents: 180000,
    compareAtCents: null,
    sizeMl: 12,
    stock: 30,
    image: "/products/photos/mitti-attar.jpg",
    featured: false,
  },
  {
    slug: "desi-gulab",
    name: "Desi Gulab",
    tagline: "Desi gulab, distilled at dawn",
    description:
      "Local desi roses picked at first light and steam-distilled the same morning into a sandalwood base. Desi Gulab is rose the way the subcontinent has always worn it — warm, honeyed, unhurried.\nAlcohol-free, 12 ml rollerball.",
    productType: ATTAR,
    scentFamily: "Floral",
    gender: "Unisex",
    notesTop: "Desi rose",
    notesHeart: "Rose honey, soft spice",
    notesBase: "Sandalwood oil, musk",
    priceCents: 240000,
    compareAtCents: null,
    sizeMl: 12,
    stock: 25,
    image: "/products/photos/gulab-e-lahore.jpg",
    featured: false,
  },
];

const sampleReviews = [
  {
    productSlug: "noir-oud",
    userName: "Camille",
    rating: 5,
    title: "The real thing",
    body: "I own ouds three times this price that smell synthetic next to it. Twelve hours later it is still telling the story.",
  },
  {
    productSlug: "noir-oud",
    userName: "Jonas",
    rating: 4,
    title: "Powerful — respect it",
    body: "Two sprays maximum. It fills a room, in a good way, but it fills a room.",
  },
  {
    productSlug: "fleur-blanche",
    userName: "Camille",
    rating: 5,
    title: "Jasmine without the scream",
    body: "Most white florals shout. This one speaks quietly and everyone leans in. My signature now.",
  },
  {
    productSlug: "aurore",
    userName: "Jonas",
    rating: 5,
    title: "Sunlight, somehow",
    body: "Bought for my partner, keep borrowing it. The honey note never turns cloying.",
  },
  {
    productSlug: "mitti-attar",
    userName: "Camille",
    rating: 5,
    title: "Barish in a bottle",
    body: "It is exactly the smell of the first rain on hot earth. My grandmother recognized it instantly. Worth ten times the price.",
  },
  {
    productSlug: "oudh-kalakassi",
    userName: "Jonas",
    rating: 5,
    title: "One drop, all day",
    body: "Applied after Fajr, still there at Isha. Real attar longevity — sprays cannot compete.",
  },
];

// Volume-tiered size options (matches scripts that migrate the live DB).
const roundPaisa = (p) => Math.max(50000, Math.round(p / 5000) * 5000);
const sizeCurve = (ml) => (ml <= 6 ? 1.6 : ml <= 15 ? 1.3 : ml <= 30 ? 1.1 : 0.95);
function withSizes(product) {
  const isAttar = product.productType === "Attar Oil";
  const mls = isAttar ? [3, 6, 12, 25] : [5, 15, 30, 50];
  const defaultMl = isAttar ? 12 : 30;
  const perMl = product.priceCents / product.sizeMl;
  const priced = mls.map((ml) => ({ ml, priceCents: roundPaisa(perMl * ml * sizeCurve(ml)), compareAtCents: null }));
  const base = priced.find((s) => s.ml === defaultMl);
  return {
    ...product,
    sizeMl: defaultMl,
    priceCents: base.priceCents,
    compareAtCents: null,
    sizes: priced.filter((s) => s.ml !== defaultMl),
  };
}

async function main() {
  // --- Catalog (idempotent by slug) ---
  for (const raw of products) {
    const product = withSizes(raw);
    await db.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
  }
  console.log(`Seeded ${products.length} products (incl. 3 attars) with size options.`);

  // --- Admin account ---
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "";
  if (adminEmail && adminPassword.length >= 10) {
    await db.user.upsert({
      where: { email: adminEmail },
      update: { role: "ADMIN" },
      create: {
        email: adminEmail,
        name: "Store Admin",
        role: "ADMIN",
        passwordHash: hashSync(adminPassword, 12),
      },
    });
    console.log(`Admin account ready: ${adminEmail}`);
  } else {
    console.warn(
      "SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD (min 10 chars) not set — no admin created."
    );
  }

  // Reviews are intentionally NOT seeded — only real customer reviews appear
  // on the store (customers can review with or without an account).

  // --- Welcome discount code (idempotent; admin can manage it at /admin/coupons) ---
  await db.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      kind: "PERCENT",
      value: 10,
      minSubtotalCents: 250000, // Rs 2,500 minimum order
      active: true,
    },
  });
  console.log("Seeded coupon WELCOME10 (10% off orders of Rs 2,500+).");
}

main()
  .then(() => db.$disconnect())
  .catch((error) => {
    console.error(error);
    return db.$disconnect().then(() => process.exit(1));
  });

