import { NextResponse } from "next/server";

import { jsonError } from "@/lib/security/api";
import { validateRequiredId } from "@/lib/security/contentPolicy";
import { ensureWorldCupGameRow, isWorldCupRouteGameId } from "@/lib/supabase/resolveArenaGame";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/arena/game?gameId=
 * Ensures World Cup schedule games exist in `games` before room reads/writes.
 */
export async function GET(request: Request) {
  const gameId = new URL(request.url).searchParams.get("gameId");
  const gameIdCheck = validateRequiredId(gameId, "Match");

  if (!gameIdCheck.valid) {
    return jsonError(gameIdCheck.error);
  }

  if (isWorldCupRouteGameId(gameIdCheck.value)) {
    const { error: ensureError } = await ensureWorldCupGameRow(gameIdCheck.value);

    if (ensureError) {
      return jsonError(ensureError.message, 503);
    }
  }

  const supabase = await createClient();

  if (!supabase) {
    return jsonError("Supabase is not configured.", 503);
  }

  const { data: game, error } = await supabase.from("games").select("*").eq("id", gameIdCheck.value).maybeSingle();

  if (error) {
    return jsonError("Unable to load match.", 400);
  }

  return NextResponse.json({ game, gameId: gameIdCheck.value });
}
