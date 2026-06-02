import { NextResponse } from "next/server";

import { jsonError } from "@/lib/security/api";
import { validateRequiredId } from "@/lib/security/contentPolicy";
import { buildArenaFeed } from "@/lib/supabase/arena";
import { getMyModerationFilters } from "@/lib/supabase/moderation";
import { ensureWorldCupGameRow, isWorldCupRouteGameId } from "@/lib/supabase/resolveArenaGame";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/arena/feed?gameId=
 * Server-backed Match Calls feed (same game id as writes).
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

  const { mutedUserIds, blockedUserIds } = await getMyModerationFilters(supabase);
  const excludedUserIds = new Set([...mutedUserIds, ...blockedUserIds]);
  const { takes, error, resolvedGameId } = await buildArenaFeed(supabase, gameIdCheck.value, excludedUserIds);

  if (error) {
    return jsonError(error.message, 400);
  }

  return NextResponse.json({
    takes,
    gameId: resolvedGameId ?? gameIdCheck.value,
    count: takes.length,
  });
}
