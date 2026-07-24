import Link from "next/link";
import { site } from "@/lib/site";
import { formatPrice } from "@/lib/format";
import PolicyLayout from "@/components/PolicyLayout";

export const metadata = {
  title: "Shipping & Delivery Policy",
  description: `How ${site.name} ships across Pakistan — timeframes, charges, and Cash on Delivery.`,
};

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="pt-2 font-serif text-xl text-ink">{children}</h2>
);

export default function ShippingPolicyPage() {
  return (
    <PolicyLayout title="Shipping & Delivery" updated="5 July 2026">
      <p>
        We ship nationwide across Pakistan. {site.deliveryNote}.
      </p>

      <H>Charges</H>
      <p>
        Orders paid online (debit/credit card, PayFast, or bank transfer) ship{" "}
        <strong className="text-ink">free</strong>. Cash on Delivery orders carry a
        flat delivery charge of {formatPrice(site.shippingFlatCents)}, which is
        waived automatically on orders over {formatPrice(site.freeShippingThresholdCents)}.
        Any applicable charge is shown clearly at checkout before you place your order.
      </p>

      <H>Timeframes</H>
      <p>
        Orders are typically dispatched within 1–2 working days. Delivery then
        takes a further 2–4 working days depending on your city, via our courier
        partners (TCS / Leopards). Remote areas may take a little longer. Bank-transfer
        orders are dispatched once the payment is confirmed.
      </p>

      <H>Tracking</H>
      <p>
        When your order ships we email you the courier name and tracking number.
        You can also check your order status anytime on our{" "}
        <Link href="/track" className="text-gold-dark underline hover:no-underline">
          order tracking page
        </Link>{" "}
        using your order number and the email or phone you used at checkout.
      </p>

      <H>Delivery attempts &amp; the courier call</H>
      <p>
        Our courier calls the mobile number on your order before delivery, so
        please make sure it&apos;s correct and reachable. If a delivery cannot be
        completed, the courier will usually re-attempt or hold the parcel for
        collection. Repeatedly failed COD deliveries may affect eligibility for
        Cash on Delivery on future orders.
      </p>

      <H>Questions</H>
      <p>
        Message us on WhatsApp at{" "}
        <a
          href={`https://wa.me/${site.whatsapp.number}`}
          className="text-gold-dark underline hover:no-underline"
        >
          {site.whatsapp.display}
        </a>{" "}
        with your order number and we&apos;ll help right away.
      </p>
    </PolicyLayout>
  );
}
