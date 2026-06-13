import { NextResponse } from "next/server";

import { validateGameId } from "@/lib/gameRoom/validation";
import { enforceRateLimit, jsonError } from "@/lib/security/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseAdminSetupError } from "@/lib/supabase/env";
import { getFeaturedWorldCupVideoForMatch } from "@/lib/worldCup/worldCupVideos";

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
  const homeTeam = url.searchParams.get("homeTeam")?.trim() || "HOME";
  const awayTeam = url.searchParams.get("awayTeam")?.trim() || "AWAY";

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

  const { video, error } = await getFeaturedWorldCupVideoForMatch(admin, {
    matchId: gameIdCheck.value,
    homeTeam,
    awayTeam,
  });

  if (error) {
    return jsonError(error, 500);
  }

  return NextResponse.json({ video });
}
