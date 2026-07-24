import { z } from "zod";
import { site } from "./site";

// bcrypt only uses the first 72 bytes of a password, so cap length there.
const password = z
  .string()
  .min(10, "Password must be at least 10 characters.")
  .max(72, "Password must be at most 72 characters.");

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .max(254);

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short.").max(60),
  email,
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required.").max(72),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(3, "Title is too short.").max(80),
  body: z.string().trim().min(10, "Review is too short.").max(1000),
  // Required for guests; ignored for signed-in users (their name is used).
  name: z.string().trim().min(2, "Please enter your name.").max(60).optional(),
});

export const newsletterSchema = z.object({ email });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(20).max(200),
  password,
});

export const stockNotifySchema = z.object({ email });

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email,
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(2000),
});

export const wishlistToggleSchema = z.object({
  productId: z.string().min(1).max(40),
});

// Pakistani mobile numbers (03XX-XXXXXXX or +92 3XX XXXXXXX) or a general
// international number — couriers call before delivery, so this is required.
const phone = z
  .string()
  .trim()
  .min(10, "Enter a valid phone number (e.g. 0300-1234567).")
  .max(17)
  .regex(/^\+?[0-9][0-9 -]{8,15}$/, "Enter a valid phone number (e.g. 0300-1234567).");

const cartItems = z
  .array(
    z.object({
      id: z.string().min(1).max(40),
      sizeMl: z.number().int().min(1).max(1000),
      quantity: z.number().int().min(1).max(10),
    })
  )
  .min(1, "Your cart is empty.")
  .max(20);

const couponCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9_-]{3,40}$/, "Enter a valid discount code.");

export const checkoutSchema = z.object({
  items: cartItems,
  couponCode: couponCode.optional().or(z.literal("")),
  paymentMethod: z.enum(site.paymentMethods),
  customer: z.object({
    email,
    name: z.string().trim().min(2).max(80),
    phone,
    addressLine1: z.string().trim().min(3).max(120),
    addressLine2: z.string().trim().max(120).optional().or(z.literal("")),
    city: z.string().trim().min(1).max(80),
    province: z.string().trim().max(60).optional().or(z.literal("")),
    postalCode: z.string().trim().min(2).max(20),
    country: z.string().trim().min(2).max(60),
  }),
});

export const productSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug: lowercase letters, numbers, hyphens."),
  name: z.string().trim().min(2).max(80),
  tagline: z.string().trim().min(2).max(140),
  description: z.string().trim().min(10).max(4000),
  productType: z.enum(site.productTypes),
  scentFamily: z.enum(site.scentFamilies),
  gender: z.enum(site.genders),
  notesTop: z.string().trim().min(2).max(200),
  notesHeart: z.string().trim().min(2).max(200),
  notesBase: z.string().trim().min(2).max(200),
  priceCents: z.number().int().min(100).max(10_000_000),
  compareAtCents: z.number().int().min(100).max(10_000_000).nullable().optional(),
  sizeMl: z.number().int().min(1).max(1000),
  // Extra size options beyond the default size above.
  sizes: z
    .array(
      z.object({
        ml: z.number().int().min(1).max(1000),
        priceCents: z.number().int().min(100).max(10_000_000),
        compareAtCents: z.number().int().min(100).max(10_000_000).nullable().optional(),
      })
    )
    .max(8)
    .optional(),
  stock: z.number().int().min(0).max(1_000_000),
  image: z
    .string()
    .trim()
    .max(300)
    .regex(/^\/[a-zA-Z0-9/._-]*$/, "Image must be a local path like /products/name.svg."),
  featured: z.boolean(),
  published: z.boolean(),
});

export const orderStatusSchema = z.object({
  status: z.enum(site.orderStatuses),
  // Optional courier details, captured when an order is marked SHIPPED.
  courierName: z.string().trim().max(60).optional().or(z.literal("")),
  trackingNumber: z.string().trim().max(80).optional().or(z.literal("")),
});

// Client-side "Apply code" preview — the discount is still recomputed at checkout.
export const couponPreviewSchema = z.object({
  code: couponCode,
  items: cartItems,
});

export const couponSchema = z
  .object({
    code: couponCode,
    kind: z.enum(["PERCENT", "FIXED"]),
    value: z.number().int().min(1).max(10_000_000),
    minSubtotalCents: z.number().int().min(0).max(100_000_000),
    maxUses: z.number().int().min(1).max(1_000_000).nullable().optional(),
    expiresAt: z.coerce.date().nullable().optional(),
    active: z.boolean(),
  })
  .superRefine((coupon, ctx) => {
    if (coupon.kind === "PERCENT" && coupon.value > 90) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: "Percentage discounts are capped at 90%.",
      });
    }
  });

export const couponUpdateSchema = z.object({
  active: z.boolean(),
});

// Guest order tracking: order number (e.g. RC-10042) + the email or phone used.
export const trackOrderSchema = z.object({
  orderNumber: z.string().trim().min(1).max(40),
  contact: z.string().trim().min(5).max(254),
});

export const storeSettingsSchema = z.object({
  mode: z.enum(["LIVE", "COMING_SOON", "MAINTENANCE"]),
  coverTitle: z.string().trim().max(120),
  coverMessage: z.string().trim().max(1000),
  launchAt: z.coerce.date().nullable().optional(),
  announcement: z.string().trim().max(200),
});
