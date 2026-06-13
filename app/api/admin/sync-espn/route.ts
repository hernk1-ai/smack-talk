import { NextResponse } from "next/server";

import {
  ADMIN_SECRET_HEADER,
  isAdminSecretConfigured,
  isCronSecretConfigured,
  verifyAdminSecret,
  verifyCronSecret,
} from "@/lib/admin/secret";
import { enforceRateLimit, jsonError } from "@/lib/security/api";
import {
  alignMappedWorldCupGamesToEspn,
  autoMapTodaysWorldCupGames,
  fetchEspnWorldCupEventsForDates,
  proposeEspnMatchMappings,
  syncEspnWorldCupScores,
  upcomingScheduleDates,
} from "@/lib/sports/espnWorldCupSync";
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
 * Authorize via either the admin secret (manual trigger from the panel) or the
 * cron secret (Vercel Cron). Fails closed unless at least one secret is
 * configured and a matching credential is supplied.
 */
function authorize(request: Request): NextResponse | null {
  const adminConfigured = isAdminSecretConfigured();
  const cronConfigured = isCronSecretConfigured();

  if (!adminConfigured && !cronConfigured) {
    return jsonError("ESPN sync is not configured.", 503);
  }

  const adminOk = adminConfigured && verifyAdminSecret(request.headers.get(ADMIN_SECRET_HEADER));
  const cronOk = cronConfigured && verifyCronSecret(getBearerToken(request));

  if (!adminOk && !cronOk) {
    return jsonError("Unauthorized.", 401);
  }

  return null;
}

export async function POST(request: Request) {
  const rateLimited = enforceRateLimit({ request, action: "admin-sync-espn", limit: 60, windowMs: 60 * 1000 });
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

  const mode = new URL(request.url).searchParams.get("mode");
  if (mode === "auto-map-today") {
    const report = await autoMapTodaysWorldCupGames(admin);
    return NextResponse.json({ mode: "auto-map-today", report });
  }

  if (mode === "align-teams") {
    const report = await alignMappedWorldCupGamesToEspn(admin);
    return NextResponse.json({ mode: "align-teams", report });
  }

  const summary = await syncEspnWorldCupScores(admin);
  return NextResponse.json({ summary });
}

/**
 * Dry-run mapping helper: returns proposed espn_match_map rows by matching ESPN
 * events to the static World Cup schedule across upcoming dates. Never writes —
 * review then insert via SQL or the admin tooling.
 *
 * Optional `?days=N` controls how many upcoming match dates to scan (default 14,
 * max 32).
 */
export async function GET(request: Request) {
  const rateLimited = enforceRateLimit({ request, action: "admin-sync-espn", limit: 60, windowMs: 60 * 1000 });
  if (rateLimited) {
    return rateLimited;
  }

  const unauthorized = authorize(request);
  if (unauthorized) {
    return unauthorized;
  }

  const daysParam = Number(new URL(request.url).searchParams.get("days"));
  const maxDates = Number.isFinite(daysParam) && daysParam > 0 ? Math.min(Math.floor(daysParam), 32) : 14;

  try {
    const dates = upcomingScheduleDates(new Date(), maxDates);
    const events = await fetchEspnWorldCupEventsForDates(dates);
    const proposals = proposeEspnMatchMappings(events);
    return NextResponse.json({ scannedDates: dates, fetchedEvents: events.length, proposals });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to fetch ESPN scoreboard.", 502);
  }
}
