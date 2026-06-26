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

/** Bearer token from the Authorization header (used by Vercel Cron). */
function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) {
    return null;
  }

  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() ?? null;
}

/**
 * Authorize via admin secret (manual trigger) or cron secret (scheduled job).
 * Matches the existing ESPN sync authorization pattern.
 */
function authorize(request: Request): NextResponse | null {
  const adminConfigured = isAdminSecretConfigured();
  const cronConfigured = isCronSecretConfigured();

  if (!adminConfigured && !cronConfigured) {
    return jsonError("Standings sync is not configured.", 503);
  }

  const adminOk = adminConfigured && verifyAdminSecret(request.headers.get(ADMIN_SECRET_HEADER));
  const cronOk = cronConfigured && verifyCronSecret(getBearerToken(request));

  if (!adminOk && !cronOk) {
    return jsonError("Unauthorized.", 401);
  }

  return null;
}

export async function POST(request: Request) {
  const rateLimited = enforceRateLimit({ request, action: "world-cup-standings-sync", limit: 30, windowMs: 60 * 1000 });
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
