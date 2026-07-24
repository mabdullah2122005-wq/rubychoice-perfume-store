import { site } from "@/lib/site";
import type { StoreSettingsData } from "@/lib/settings";
import NewsletterForm from "./NewsletterForm";
import LaunchCountdown from "./LaunchCountdown";

// Full-screen cover shown to visitors while the store is in
// COMING_SOON or MAINTENANCE mode (admins bypass it).
export default function CoverPage({ settings }: { settings: StoreSettingsData }) {
  const comingSoon = settings.mode === "COMING_SOON";
  const title =
    settings.coverTitle ||
    (comingSoon ? "Launching soon" : "We'll be right back");
  const message =
    settings.coverMessage ||
    (comingSoon
      ? "Something beautiful is being bottled. Small-batch eaux de parfum and traditional attars, crafted in Pakistan — Cash on Delivery nationwide from day one."
      : "The boutique is closed for a short maintenance break. Your carts and orders are safe — please check back in a little while.");
  const showCountdown =
    comingSoon && settings.launchAt !== null && settings.launchAt.getTime() > Date.now();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <p className="chip">Maison de parfum · Pakistan</p>
      <p className="mt-8 font-serif text-3xl tracking-[0.22em] text-gradient-gold sm:text-4xl">
        {site.name.toUpperCase()}
      </p>

      <h1 className="mt-6 max-w-2xl font-serif text-4xl leading-[1.1] sm:text-6xl">
        {title}
      </h1>
      <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-soft sm:text-base">
        {message}
      </p>

      {showCountdown && (
        <div className="mt-10">
          <LaunchCountdown target={settings.launchAt!.toISOString()} />
        </div>
      )}

      {comingSoon && (
        <div className="mt-10 w-full max-w-sm">
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-ink-soft">
            Be first at the counter
          </p>
          <NewsletterForm />
        </div>
      )}

      <a
        href={`https://wa.me/${site.whatsapp.number}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-10 text-xs uppercase tracking-[0.2em] text-ink-soft underline-offset-4 hover:underline"
      >
        WhatsApp {site.whatsapp.display}
      </a>

      <p className="mt-12 text-[11px] text-ink-soft/70">
        © {new Date().getFullYear()} {site.legalName}
      </p>
    </main>
  );
}
