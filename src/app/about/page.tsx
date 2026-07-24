import Link from "next/link";
import { site } from "@/lib/site";

export const metadata = {
  title: "Our story",
  description: `The story of ${site.name} — a maison de parfum built on rare naturals and slow craft.`,
};

export default function AboutPage() {
  return (
    <div>
      <section className="bg-cream-dark">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <p className="text-xs uppercase tracking-[0.3em] text-gold-dark">Our story</p>
          <h1 className="mt-3 font-serif text-5xl leading-tight">
            Perfume is memory, <em className="text-gold-dark">bottled</em>
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-2xl space-y-6 px-4 py-16 leading-relaxed text-ink-soft sm:px-6">
        <p>
          {site.name} began in a single room above a spice market — a bench, a
          scale, and forty amber vials. We believed then what we believe now:
          that a great fragrance is not manufactured, it is <em>composed</em>,
          the way a piece of music is composed, with silence between the notes.
        </p>
        <p>
          Every composition starts with named materials from named places —
          jasmine from Grasse picked before sunrise, cedar smoked over juniper,
          bergamot dried on Calabrian rooftops. We macerate each blend for six
          weeks, longer than the industry has patience for, because time is the
          one ingredient that cannot be synthesized.
        </p>
        <p>
          Our bottles are filled by hand, corked, and stamped in wax. Batches
          are small enough that we sign them. When a harvest disappoints, a
          fragrance simply waits a season — we would rather be out of stock
          than out of character.
        </p>
        <p>
          {site.name} is composed and bottled in Pakistan — a country with a
          perfume memory older than any European maison, from the attar souks
          of the subcontinent to the oudh traditions of the Gulf trade.
          Alongside our eaux de parfum we distil a small line of traditional
          attars, alcohol-free concentrated oils in the old style.
        </p>
        <p>
          And because luxury should never feel risky: Cash on Delivery is
          available nationwide, shipping is free over Rs 5,000, orders arrive
          in 2–4 working days by courier, and our WhatsApp line answers within
          the hour.
        </p>
        <div className="pt-6 text-center">
          <Link href="/shop" className="btn-primary">
            Discover the collection
          </Link>
        </div>
      </section>
    </div>
  );
}
