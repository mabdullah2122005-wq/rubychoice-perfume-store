import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/auth";
import { invalidateSettingsCache } from "@/lib/settings";
import { storeSettingsSchema } from "@/lib/validation";
import { csrfGuard, jsonError, readJson, zodErrorResponse } from "@/lib/http";

export async function PATCH(request: NextRequest) {
  try {
    const csrf = csrfGuard(request);
    if (csrf) return csrf;

    const admin = await getAdminUser();
    if (!admin) return jsonError("Admin access required.", 403);

    const body = await readJson(request);
    const parsed = storeSettingsSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const data = {
      mode: parsed.data.mode,
      coverTitle: parsed.data.coverTitle,
      coverMessage: parsed.data.coverMessage,
      launchAt: parsed.data.launchAt ?? null,
      announcement: parsed.data.announcement,
    };
    const settings = await db.storeSettings.upsert({
      where: { id: "main" },
      update: data,
      create: { id: "main", ...data },
    });
    invalidateSettingsCache();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("settings update failed:", error);
    return jsonError("Could not save settings.", 500);
  }
}
