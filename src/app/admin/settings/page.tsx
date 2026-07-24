import Link from "next/link";
import { getStoreSettings, storefrontClosed } from "@/lib/settings";
import SettingsForm from "@/components/admin/SettingsForm";

export const metadata = { title: "Store settings — Admin" };

export default async function AdminSettingsPage() {
  const settings = await getStoreSettings();
  const closed = storefrontClosed(settings);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl">Store settings</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-widest ${
            closed ? "bg-wine text-cream" : "bg-ink text-cream"
          }`}
        >
          {closed
            ? settings.mode === "MAINTENANCE"
              ? "Visitors see: maintenance"
              : "Visitors see: launching soon"
            : "Store is live"}
        </span>
      </div>

      <p className="mb-8 max-w-2xl text-sm text-ink-soft">
        Control what visitors see. As an admin you always see the real store —
        open a private/incognito window to preview the cover page exactly as
        visitors do, or{" "}
        <Link href="/" className="text-gold-dark underline">
          browse the storefront
        </Link>
        .
      </p>

      <SettingsForm
        initial={{
          mode: settings.mode,
          coverTitle: settings.coverTitle,
          coverMessage: settings.coverMessage,
          launchAt: settings.launchAt ? settings.launchAt.toISOString() : null,
          announcement: settings.announcement,
        }}
      />
    </div>
  );
}
