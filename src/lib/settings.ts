import { db } from "./db";

export type StoreMode = "LIVE" | "COMING_SOON" | "MAINTENANCE";

export type StoreSettingsData = {
  mode: StoreMode;
  coverTitle: string;
  coverMessage: string;
  launchAt: Date | null;
  announcement: string;
};

export const defaultSettings: StoreSettingsData = {
  mode: "LIVE",
  coverTitle: "",
  coverMessage: "",
  launchAt: null,
  announcement: "",
};

// Read on every page render, so cache briefly per server instance — a mode
// change still propagates within seconds, but repeat visitors don't pay a
// database round trip for it.
let cached: { data: StoreSettingsData; at: number } | null = null;
const CACHE_MS = 5_000;

/** Singleton settings row; absent row = a live store with default copy. */
export async function getStoreSettings(): Promise<StoreSettingsData> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.data;
  const row = await db.storeSettings.findUnique({ where: { id: "main" } });
  if (!row) {
    cached = { data: defaultSettings, at: Date.now() };
    return defaultSettings;
  }
  const mode: StoreMode = ["LIVE", "COMING_SOON", "MAINTENANCE"].includes(row.mode)
    ? (row.mode as StoreMode)
    : "LIVE";
  const data: StoreSettingsData = {
    mode,
    coverTitle: row.coverTitle,
    coverMessage: row.coverMessage,
    launchAt: row.launchAt,
    announcement: row.announcement,
  };
  cached = { data, at: Date.now() };
  return data;
}

/** Called by the admin settings API so saves apply instantly. */
export function invalidateSettingsCache(): void {
  cached = null;
}

/**
 * Whether visitors should see the cover instead of the storefront.
 * A COMING_SOON store whose countdown has elapsed opens automatically —
 * the admin can schedule a launch and sleep through it.
 */
export function storefrontClosed(settings: StoreSettingsData): boolean {
  if (settings.mode === "MAINTENANCE") return true;
  if (settings.mode === "COMING_SOON") {
    return !(settings.launchAt && settings.launchAt.getTime() <= Date.now());
  }
  return false;
}
