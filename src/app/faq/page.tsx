import Link from "next/link";
import { site } from "@/lib/site";
import { formatPrice } from "@/lib/format";

export const metadata = {
  title: "FAQ — Delivery, Payments & Returns",
  description:
    "Everything about Cash on Delivery, shipping times, bank transfer, returns and attars.",
};

const faqs = [
  {
    q: "Do you offer Cash on Delivery?",
    a: `Yes — COD is available across all of Pakistan and it's our most popular way to pay. Place your order online, and pay the rider in cash when your parcel arrives. Our courier calls your mobile number before delivery, so please double-check it at checkout.`,
  },
  {
    q: "How long does delivery take, and what does it cost?",
    a: `${site.deliveryNote}. Shipping is free whenever you pay online — by card, PayFast or bank transfer. Cash on Delivery orders have a flat ${formatPrice(site.shippingFlatCents)} delivery charge, which is waived on orders over ${formatPrice(site.freeShippingThresholdCents)}.`,
  },
  {
    q: "How does bank transfer work?",
    a: `Choose "Bank transfer" at checkout and we'll show you our account details (${site.bank.bank}) along with your order number. Transfer the total, send us the receipt on WhatsApp (${site.whatsapp.display}), and we ship as soon as the payment is confirmed — usually the same day.`,
  },
  {
    q: "Can I pay online by card or PayFast?",
    a: "Yes — choose Card at checkout and enter your Visa/Mastercard details, or choose PayFast to pay with cards, wallets or a bank account on PayFast's secure page (you're redirected there and brought straight back). Either way the payment is processed on a PCI-compliant gateway — we never see or store your card number. Online payments also ship free.",
  },
  {
    q: "How do I use a discount code?",
    a: `Enter your code in the "Discount code" box on the checkout page and press Apply — the discount is deducted from your total before you place the order. One code per order.`,
  },
  {
    q: "What is the difference between an eau de parfum and an attar?",
    a: "An eau de parfum is a spray fragrance where perfume oils are carried in alcohol — bright projection and a classic wear. An attar is a traditional, alcohol-free concentrated oil, worn directly on the pulse points. Attars sit closer to the skin, last many hours, and a small bottle goes a very long way.",
  },
  {
    q: "Are your fragrances original?",
    a: "Every bottle is composed and filled by hand in our own atelier — our own impressions and signature compositions. Each flacon is wax-stamped as it leaves the maison.",
  },
  {
    q: "What is your return policy?",
    a: "Unopened bottles can be returned within 7 days of delivery for a full refund of the product price. If a parcel arrives damaged, send us a photo on WhatsApp within 48 hours and we'll replace it at no cost.",
  },
  {
    q: "How can I track my order?",
    a: `Use the Track order page (in the footer): enter your order number with the email or mobile you used at checkout — no account needed. If you ordered while signed in, your history also lives under My account → Orders, and you can always message us on WhatsApp (${site.whatsapp.display}) with your order number.`,
  },
  {
    q: "How should I store my perfume?",
    a: "Keep bottles upright, away from direct sunlight and heat — a drawer or cupboard is ideal, the bathroom is not. Stored well, an eau de parfum keeps its character for years; attars often deepen beautifully with age.",
  },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <p className="text-xs uppercase tracking-[0.3em] text-gold">Help</p>
      <h1 className="mt-1 font-serif text-4xl sm:text-5xl">Frequently asked questions</h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-soft">
        Delivery, payments, returns and perfume care — answered. Can’t find
        what you need?{" "}
        <Link href="/contact" className="text-gold-dark underline hover:no-underline">
          Write to us
        </Link>{" "}
        or message us on{" "}
        <a
          href={`https://wa.me/${site.whatsapp.number}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold-dark underline hover:no-underline"
        >
          WhatsApp
        </a>
        .
      </p>

      <div className="mt-10 divide-y divide-parchment border-y border-parchment">
        {faqs.map((f) => (
          <details key={f.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-xl">
              {f.q}
              <span
                aria-hidden
                className="shrink-0 text-ink-soft transition group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">{f.a}</p>
          </details>
        ))}
      </div>

      <div className="card-panel mt-10 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="font-serif text-2xl">Still unsure?</h2>
          <p className="mt-1 text-sm text-ink-soft">
            We answer on WhatsApp every day, 10am–10pm.
          </p>
        </div>
        <a
          href={`https://wa.me/${site.whatsapp.number}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          Chat with us
        </a>
      </div>
    </div>
  );
}
