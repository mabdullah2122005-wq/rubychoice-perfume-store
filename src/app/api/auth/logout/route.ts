import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { csrfGuard } from "@/lib/http";

export async function POST(request: NextRequest) {
  const csrf = csrfGuard(request);
  if (csrf) return csrf;
  await destroySession();
  return NextResponse.json({ ok: true });
}
