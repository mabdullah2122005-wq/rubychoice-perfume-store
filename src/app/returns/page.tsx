import Link from "next/link";
import { site } from "@/lib/site";
import PolicyLayout from "@/components/PolicyLayout";

export const metadata = {
  title: "Return & Refund Policy",
  description: `${site.name}'s return, exchange and refund policy for perfumes and attars.`,
};

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="pt-2 font-serif text-xl text-ink">{children}</h2>
);

export default function ReturnsPolicyPage() {
  return (
    <PolicyLayout title="Return & Refund Policy" updated="5 July 2026">
      <p>
        We want you to love what you receive. If something isn&apos;t right, here&apos;s
        how returns, exchanges and refunds work.
      </p>

      <H>7-day returns on unopened items</H>
      <p>
        Unopened, unused fragrances in their original, sealed packaging may be
        returned within 7 days of delivery for a refund of the product price.
        For hygiene and authenticity reasons, we cannot accept returns of opened
        or used perfumes and attars unless the item is faulty or was sent in error.
      </p>

      <H>Damaged, faulty or wrong items</H>
      <p>
        If your order arrives damaged, leaking, faulty, or is not what you
        ordered, please contact us within 48 hours of delivery with a photo. We&apos;ll
        arrange a free replacement or a full refund, including any delivery charge.
      </p>

      <H>How to start a return</H>
      <p>
        Message us on WhatsApp at{" "}
        <a
          href={`https://wa.me/${site.whatsapp.number}`}
          className="text-gold-dark underline hover:no-underline"
        >
          {site.whatsapp.display}
        </a>{" "}
        or via our{" "}
        <Link href="/contact" className="text-gold-dark underline hover:no-underline">
          contact page
        </Link>{" "}
        with your order number and the reason for the return. We&apos;ll confirm the
        return address and next steps. Please don&apos;t send items back without
        contacting us first.
      </p>

      <H>Refunds</H>
      <p>
        Once we receive and inspect the returned item, we issue your refund within
        3–5 working days. Card and PayFast payments are refunded to the original
        payment method; bank-transfer and Cash-on-Delivery orders are refunded by
        bank transfer to an account you provide. Original delivery charges are
        non-refundable except where the item was faulty or sent in error. Return
        shipping is the customer&apos;s responsibility unless the item was faulty or
        incorrect.
      </p>

      <H>Non-returnable items</H>
      <p>
        Opened or used products, items without their original packaging, gift
        cards, and items marked as final sale cannot be returned unless faulty.
      </p>
    </PolicyLayout>
  );
}
