import Link from "next/link";
import { site } from "@/lib/site";
import PolicyLayout from "@/components/PolicyLayout";

export const metadata = {
  title: "Privacy Policy",
  description: `How ${site.name} collects, uses and protects your personal information.`,
};

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="pt-2 font-serif text-xl text-ink">{children}</h2>
);

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout title="Privacy Policy" updated="5 July 2026">
      <p>
        {site.legalName} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) respects your privacy.
        This policy explains what information we collect when you use {site.url.replace(/^https?:\/\//, "")},
        why we collect it, and the choices you have.
      </p>

      <H>Information we collect</H>
      <p>
        When you place an order or create an account we collect your name, email
        address, phone number, and delivery address. When you contact us or
        subscribe to our newsletter we collect your name and email. We also collect
        basic technical data (such as your device and pages visited) needed to run
        the site securely. We do <strong className="text-ink">not</strong> store your
        card details — card payments are handled entirely on our payment provider&apos;s
        secure, PCI-compliant systems.
      </p>

      <H>How we use it</H>
      <p>
        We use your information to process and deliver your orders, send order and
        delivery updates, respond to your messages, prevent fraud, and — only if you
        opt in — send occasional news about new fragrances and offers. You can
        unsubscribe from marketing emails at any time.
      </p>

      <H>Who we share it with</H>
      <p>
        We share information only with the partners needed to fulfil your order:
        our courier (to deliver your parcel), our payment provider (to process
        payments), and our email provider (to send order and account emails). These
        partners may process data outside Pakistan. We never sell your personal
        information.
      </p>

      <H>Cookies</H>
      <p>
        We use essential cookies to keep you signed in and to remember your cart.
        These are required for the site to work and don&apos;t track you across other
        websites.
      </p>

      <H>Data retention &amp; security</H>
      <p>
        We keep order records for as long as needed for accounting and legal
        purposes, and account data until you ask us to delete it. Passwords are
        stored only as secure one-way hashes, and the site is served over encrypted
        HTTPS.
      </p>

      <H>Your choices</H>
      <p>
        You can access, correct or delete your account information, or ask us for a
        copy of the data we hold, by contacting us. Message us on WhatsApp at{" "}
        <a
          href={`https://wa.me/${site.whatsapp.number}`}
          className="text-gold-dark underline hover:no-underline"
        >
          {site.whatsapp.display}
        </a>{" "}
        or via our{" "}
        <Link href="/contact" className="text-gold-dark underline hover:no-underline">
          contact page
        </Link>
        .
      </p>
    </PolicyLayout>
  );
}
