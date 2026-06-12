import { NextResponse } from "next/server";

import {
  ADMIN_SECRET_HEADER,
  isAdminSecretConfigured,
  isCronSecretConfigured,
  verifyAdminSecret,
  verifyCronSecret,
} from "@/lib/admin/secret";
import { enforceRateLimit, jsonError } from "@/lib/security/api";
import { syncEspnWorldCupScores } from "@/lib/sports/espnWorldCupSync";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseAdminSetupError } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Bearer token from the Authorization header (Vercel Cron sends CRON_SECRET this way). */
function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) {
    return null;
  }
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() ?? null;
}

/**
 * Authorize a cron invocation. Primary path is the Vercel-supplied CRON_SECRET
 * bearer token; the admin secret header is also accepted for manual testing.
 * Fails closed unless a configured secret matches.
 */
function authorize(request: Request): NextResponse | null {
  const cronConfigured = isCronSecretConfigured();
  const adminConfigured = isAdminSecretConfigured();

  if (!cronConfigured && !adminConfigured) {
    return jsonError("ESPN sync is not configured.", 503);
  }

  const cronOk = cronConfigured && verifyCronSecret(getBearerToken(request));
  const adminOk = adminConfigured && verifyAdminSecret(request.headers.get(ADMIN_SECRET_HEADER));

  if (!cronOk && !adminOk) {
    return jsonError("Unauthorized.", 401);
  }

  return null;
}

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit({ request, action: "cron-sync-espn", limit: 120, windowMs: 60 * 1000 });
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

  const summary = await syncEspnWorldCupScores(admin);
  return NextResponse.json({ summary });
}
