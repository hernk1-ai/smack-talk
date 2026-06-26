import { NextResponse } from "next/server";

import {
  ADMIN_SECRET_HEADER,
  isAdminSecretConfigured,
  isCronSecretConfigured,
  verifyAdminSecret,
  verifyCronSecret,
} from "@/lib/admin/secret";
import { enforceRateLimit, jsonError } from "@/lib/security/api";
import { syncFifaWorldCupStandings } from "@/lib/sports/fifaWorldCupStandingsSync";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseAdminSetupError } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) {
    return null;
  }

  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() ?? null;
}

function authorize(request: Request): NextResponse | null {
  const cronConfigured = isCronSecretConfigured();
  const adminConfigured = isAdminSecretConfigured();

  if (!cronConfigured && !adminConfigured) {
    return jsonError("Standings sync is not configured.", 503);
  }

  const cronOk = cronConfigured && verifyCronSecret(getBearerToken(request));
  const adminOk = adminConfigured && verifyAdminSecret(request.headers.get(ADMIN_SECRET_HEADER));

  if (!cronOk && !adminOk) {
    return jsonError("Unauthorized.", 401);
  }

  return null;
}

/** Daily cron entrypoint for FIFA standings sync. */
export async function GET(request: Request) {
  const rateLimited = enforceRateLimit({ request, action: "cron-sync-standings", limit: 30, windowMs: 60 * 1000 });
  if (rateLimited) {
    return rateLimited;
  }

  const unauthorized = authorize(request);
  if (unauthorized) {
    return unauthorized;
  }

  const admin = createAdminClient();
  if (!admin) {
    return jsonError(getSupabaseAdminSetupError() ?? "Supabase admin client is not configured.", 503);
  }

  try {
    const summary = await syncFifaWorldCupStandings(admin);
    return NextResponse.json({ summary });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to sync FIFA standings.", 502);
  }
}
