// Central brand configuration — rename the brand in one place.
export const site = {
  name: "Ruby Choice",
  legalName: "Ruby Choice, Pakistan",
  tagline: "Fragrances composed to be remembered",
  description:
    "Ruby Choice is a Pakistani perfume house crafting small-batch eaux de parfum and traditional attars. Cash on Delivery nationwide, free shipping over Rs 5,000.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  currency: "pkr",
  freeShippingThresholdCents: 500_000, // Rs 5,000 (stored in paisa)
  shippingFlatCents: 30_000, // Rs 300 nationwide (TCS / Leopards)
  deliveryNote: "Ships nationwide in 2–4 working days via TCS / Leopards",
  // WhatsApp business number: digits only for wa.me links + a display form.
  whatsapp: { number: "923395225607", display: "+92 339 5225607" },
  // Shown to customers who choose bank transfer.
  // TODO before launch: replace with Ruby Choice's real account details.
  bank: {
    title: "Ruby Choice",
    bank: "Meezan Bank",
    iban: "PK00 MEZN 0000 0000 0000 0000",
  },
  productTypes: ["Eau de Parfum", "Attar Oil"] as const,
  scentFamilies: ["Floral", "Woody", "Fresh", "Amber", "Citrus", "Gourmand"] as const,
  genders: ["Women", "Men", "Unisex"] as const,
  provinces: [
    "Punjab",
    "Sindh",
    "Khyber Pakhtunkhwa",
    "Balochistan",
    "Gilgit-Baltistan",
    "Azad Kashmir",
    "Islamabad Capital Territory",
  ] as const,
  orderStatuses: [
    "PENDING",
    "CONFIRMED",
    "PAID",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ] as const,
  paymentMethods: ["COD", "BANK", "CARD", "PAYFAST"] as const,
};

// Prepaid orders (bank transfer, card, PayFast) always ship free — the
// standard Pakistani e-commerce incentive to prepay, which also cuts COD
// refusal losses. COD pays the flat rate below the free-shipping threshold.
export function shippingCentsFor(
  paymentMethod: string,
  subtotalCents: number
): number {
  if (paymentMethod !== "COD") return 0;
  return subtotalCents >= site.freeShippingThresholdCents
    ? 0
    : site.shippingFlatCents;
}

export type ScentFamily = (typeof site.scentFamilies)[number];
export type OrderStatus = (typeof site.orderStatuses)[number];
export type PaymentMethod = (typeof site.paymentMethods)[number];
