import { NextResponse } from "next/server";

import { validateGameId } from "@/lib/gameRoom/validation";
import { enforceRateLimit, jsonError } from "@/lib/security/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseAdminSetupError } from "@/lib/supabase/env";
import {
  getFeaturedWorldCupVideoForMatch,
  resolveWorldCupVideoMatchContext,
} from "@/lib/worldCup/worldCupVideos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit({
    request,
    action: "game-room-video",
    limit: 60,
    windowMs: 60_000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  const url = new URL(request.url);
  const gameIdCheck = validateGameId(url.searchParams.get("gameId"));

  if (!gameIdCheck.valid) {
    return jsonError(gameIdCheck.error);
  }

  const setupError = getSupabaseAdminSetupError();
  if (setupError) {
    return jsonError("Supabase is not configured.", 503);
  }

  const admin = createAdminClient();
  if (!admin) {
    return jsonError("Supabase is not configured.", 503);
  }

  const scheduleContext = resolveWorldCupVideoMatchContext(gameIdCheck.value);
  const { data: game } = await admin
    .from("games")
    .select("status, starts_at, home_team, away_team")
    .eq("id", gameIdCheck.value)
    .maybeSingle();

  const homeTeam =
    game?.home_team?.trim() ||
    url.searchParams.get("homeTeam")?.trim() ||
    scheduleContext.homeTeam;
  const awayTeam =
    game?.away_team?.trim() ||
    url.searchParams.get("awayTeam")?.trim() ||
    scheduleContext.awayTeam;
  const startsAt =
    game?.starts_at ||
    url.searchParams.get("startsAt")?.trim() ||
    scheduleContext.startsAt;
  const status = game?.status || url.searchParams.get("status")?.trim() || scheduleContext.status;

  const { video, matchPhase, error } = await getFeaturedWorldCupVideoForMatch(admin, {
    matchId: gameIdCheck.value,
    homeTeam,
    awayTeam,
    status,
    startsAt,
  });

  if (error) {
    return jsonError(error, 500);
  }

  return NextResponse.json({ video, matchPhase });
}
