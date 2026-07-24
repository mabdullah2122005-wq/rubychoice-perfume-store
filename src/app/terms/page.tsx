import Link from "next/link";
import { site } from "@/lib/site";
import PolicyLayout from "@/components/PolicyLayout";

export const metadata = {
  title: "Terms of Service",
  description: `The terms that govern your use of ${site.name} and purchases from our store.`,
};

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="pt-2 font-serif text-xl text-ink">{children}</h2>
);

export default function TermsPage() {
  return (
    <PolicyLayout title="Terms of Service" updated="5 July 2026">
      <p>
        These terms govern your use of {site.url.replace(/^https?:\/\//, "")} and any
        purchase you make from {site.legalName}. By using the site or placing an
        order, you agree to them.
      </p>

      <H>Products &amp; pricing</H>
      <p>
        We are a Pakistani perfume house selling our own small-batch eaux de parfum
        and traditional attars. We try to describe and picture every product
        accurately, but colours and packaging may vary slightly between batches.
        All prices are in Pakistani Rupees (PKR) and include applicable taxes.
        Prices and availability can change without notice; the price charged is the
        one shown at checkout.
      </p>

      <H>Orders</H>
      <p>
        Your order is an offer to buy. We confirm it by email and, for Cash on
        Delivery, by a courier call before delivery. We may cancel or decline an
        order — for example if an item is out of stock, a price was clearly wrong,
        or we suspect fraud or repeated failed deliveries — and will refund any
        amount already paid.
      </p>

      <H>Payment</H>
      <p>
        We accept Cash on Delivery, bank transfer, and (where available) card and
        PayFast payments. Card and PayFast payments are processed by our payment
        provider on secure, PCI-compliant systems; we never see or store your card
        number. Bank-transfer orders are dispatched once payment is confirmed.
      </p>

      <H>Shipping &amp; returns</H>
      <p>
        Delivery timeframes and charges are set out in our{" "}
        <Link href="/shipping" className="text-gold-dark underline hover:no-underline">
          Shipping &amp; Delivery Policy
        </Link>
        , and returns and refunds in our{" "}
        <Link href="/returns" className="text-gold-dark underline hover:no-underline">
          Return &amp; Refund Policy
        </Link>
        . Both form part of these terms.
      </p>

      <H>Accounts</H>
      <p>
        If you create an account, you&apos;re responsible for keeping your password
        confidential and for activity under your account. Let us know immediately if
        you suspect unauthorised use.
      </p>

      <H>Acceptable use &amp; intellectual property</H>
      <p>
        All content on this site — text, photography, logos and the {site.name} name
        — belongs to us and may not be copied or used without permission. You agree
        not to misuse the site, attempt to disrupt it, or use it for anything
        unlawful.
      </p>

      <H>Liability</H>
      <p>
        Our products are cosmetic fragrances for external use. Please patch-test if
        you have sensitive skin and discontinue use if irritation occurs. To the
        extent permitted by law, our liability for any order is limited to the amount
        you paid for it.
      </p>

      <H>Contact &amp; governing law</H>
      <p>
        These terms are governed by the laws of Pakistan. Questions? Reach us via
        our{" "}
        <Link href="/contact" className="text-gold-dark underline hover:no-underline">
          contact page
        </Link>{" "}
        or WhatsApp at{" "}
        <a
          href={`https://wa.me/${site.whatsapp.number}`}
          className="text-gold-dark underline hover:no-underline"
        >
          {site.whatsapp.display}
        </a>
        .
      </p>
    </PolicyLayout>
  );
}
