import Link from "next/link";
import { site } from "@/lib/site";
import TrackOrderForm from "@/components/TrackOrderForm";

export const metadata = {
  title: "Track your order",
  description: "Check the status of your Ruby Choice order — no account needed.",
};

export default function TrackPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <p className="text-xs uppercase tracking-[0.3em] text-gold">Delivery</p>
      <h1 className="mt-1 font-serif text-4xl sm:text-5xl">Track your order</h1>
      <p className="mt-4 text-sm leading-relaxed text-ink-soft">
        Enter your order number with the email or mobile number you used at
        checkout — no account needed. Prefer to just ask?{" "}
        <a
          href={`https://wa.me/${site.whatsapp.number}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold-dark underline hover:no-underline"
        >
          WhatsApp us
        </a>{" "}
        your order number any time.
      </p>

      <div className="mt-8">
        <TrackOrderForm />
      </div>

      <p className="mt-8 text-xs text-ink-soft">
        Ordered while signed in? Your full history is under{" "}
        <Link href="/account" className="text-gold-dark underline hover:no-underline">
          My account
        </Link>
        .
      </p>
    </div>
  );
}
