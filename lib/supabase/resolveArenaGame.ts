import { getWorldCupKickoffIso, getWorldCupMatchById, type WorldCupMatch } from "@/data/worldCupSchedule";
import { ACTIVE_GAME_ID } from "@/lib/supabase/games";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AppSupabaseClient } from "@/lib/supabase/typedClient";
import type { Database } from "@/lib/supabase/types";
import { getWorldCupMatchStatus } from "@/lib/worldCupMatchStatus";

type GameInsert = Database["public"]["Tables"]["games"]["Insert"];

const WORLD_CUP_GAME_ID_PATTERN = /^wc-2026-(\d+)$/;

export function parseWorldCupRouteGameId(gameId: string) {
  const match = gameId.match(WORLD_CUP_GAME_ID_PATTERN);
  if (!match) {
    return null;
  }

  const matchId = Number(match[1]);
  const worldCupMatch = getWorldCupMatchById(matchId);

  if (!worldCupMatch) {
    return null;
  }

  return { gameId, matchId, worldCupMatch };
}

export function isWorldCupRouteGameId(gameId: string) {
  return WORLD_CUP_GAME_ID_PATTERN.test(gameId);
}

export function worldCupMatchToGameRow(gameId: string, match: WorldCupMatch): GameInsert {
  const lifecycle = getWorldCupMatchStatus(match);
  const status = lifecycle === "finished" ? "final" : lifecycle === "live" ? "live" : "scheduled";

  return {
    id: gameId,
    league: "World Cup",
    sport: "Soccer",
    home_team: match.homeTeam,
    away_team: match.awayTeam ?? "TBD",
    home_score: 0,
    away_score: 0,
    period: match.stage === "Group Stage" ? `Group ${match.group}` : match.stage,
    clock: null,
    status,
    starts_at: getWorldCupKickoffIso(match),
    watching_count: 0,
    ride_count: 0,
    fade_count: 0,
    heat: 0,
    event_slug: `wc-2026-match-${match.id}`,
    event_name: `World Cup · Match ${match.matchNumber}`,
  };
}

/** Server-only: upsert the schedule row so takes FK + feed queries use the route game id. */
export async function ensureWorldCupGameRow(gameId: string) {
  const parsed = parseWorldCupRouteGameId(gameId);
  if (!parsed) {
    return { gameId, error: null as Error | null };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      gameId,
      error: new Error("World Cup game sync is not configured."),
    };
  }

  const { error } = await admin.from("games").upsert(worldCupMatchToGameRow(gameId, parsed.worldCupMatch), {
    onConflict: "id",
  });

  return { gameId, error };
}

/**
 * Resolve the game id used for takes reads/writes.
 * World Cup room routes (wc-2026-N) must never silently map to a different game.
 */
export async function resolveArenaGameId(supabase: AppSupabaseClient, requestedGameId?: string) {
  const preferredGameId = requestedGameId?.trim() || ACTIVE_GAME_ID;

  if (isWorldCupRouteGameId(preferredGameId)) {
    const parsed = parseWorldCupRouteGameId(preferredGameId);
    if (!parsed) {
      return {
        gameId: null,
        error: new Error("World Cup match not found for this Game Room."),
      };
    }

    return { gameId: preferredGameId, error: null as Error | null };
  }

  const { data: preferredGame } = await supabase.from("games").select("id").eq("id", preferredGameId).maybeSingle();

  if (preferredGame?.id) {
    return { gameId: preferredGame.id, error: null };
  }

  if (requestedGameId?.trim()) {
    return {
      gameId: null,
      error: new Error("This Game Room match is not available yet."),
    };
  }

  const { data: fallbackGame } = await supabase
    .from("games")
    .select("id")
    .or("league.ilike.%world cup%,sport.ilike.%soccer%")
    .in("status", ["live", "scheduled", "final"])
    .order("starts_at", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (fallbackGame?.id) {
    return { gameId: fallbackGame.id, error: null };
  }

  const { data: anyFallbackGame } = await supabase
    .from("games")
    .select("id")
    .in("status", ["live", "scheduled", "final"])
    .order("starts_at", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (anyFallbackGame?.id) {
    return { gameId: anyFallbackGame.id, error: null };
  }

  return {
    gameId: null,
    error: new Error("Unable to lock your take right now. Try again."),
  };
}
