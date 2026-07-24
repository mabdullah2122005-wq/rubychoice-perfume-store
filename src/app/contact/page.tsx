import ContactForm from "@/components/ContactForm";

export const metadata = {
  title: "Contact",
  description: "Questions about an order, a fragrance, or wholesale? Write to the maison.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <p className="text-xs uppercase tracking-[0.3em] text-gold-dark">Contact</p>
      <h1 className="mt-2 font-serif text-4xl">Write to the maison</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        Questions about an order, help choosing a fragrance, press or wholesale
        — we read everything and reply within one business day.
      </p>
      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}
