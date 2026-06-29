import { getArenaGames } from "@/lib/supabase/games";
import { worldCupSchedule } from "@/data/worldCupSchedule";
import { buildKnockoutResolutionContext, type KnockoutResolutionData } from "@/lib/worldCup/knockoutMatchResolver";
import {
  resolveGameRoomNavTarget,
  type GameRoomNavTarget,
  type WorldCupGameSnapshot,
} from "@/lib/worldCupMatchResolver";

const EMPTY_KNOCKOUT_RESOLUTION: KnockoutResolutionData = {
  standings: [],
  bracket: [],
};

function isWorldCupGameRow(game: { id: string; league?: string | null }) {
  return game.league === "World Cup" || game.id.startsWith("wc-2026-");
}

async function fetchKnockoutResolutionClient(): Promise<KnockoutResolutionData> {
  try {
    const response = await fetch("/api/world-cup/knockout-resolution", { cache: "no-store" });
    if (response.ok) {
      return (await response.json()) as KnockoutResolutionData;
    }
  } catch (error) {
    console.warn("[lockt:game-room-select] Failed to load knockout resolution:", error);
  }

  return EMPTY_KNOCKOUT_RESOLUTION;
}

export async function fetchWorldCupGameSnapshots(): Promise<WorldCupGameSnapshot[]> {
  const { games } = await getArenaGames();
  return games.filter(isWorldCupGameRow).map((game) => ({
    id: game.id,
    status: game.status,
    starts_at: game.starts_at,
    home_score: game.home_score,
    away_score: game.away_score,
    home_team: game.home_team,
    away_team: game.away_team,
    clock: game.clock,
    period: game.period,
    event_name: game.event_name,
  }));
}

/** Resolve Game Room nav using the same canonical live/next logic as Schedule. */
export async function resolveGameRoomNavTargetClient(now = new Date()): Promise<GameRoomNavTarget> {
  const [games, knockoutResolution] = await Promise.all([
    fetchWorldCupGameSnapshots(),
    fetchKnockoutResolutionClient(),
  ]);

  if (games.length === 0) {
    console.warn("[lockt:game-room-select] No World Cup feed rows loaded; falling back to static schedule.");
  }

  const knockoutContext =
    knockoutResolution.standings.length || knockoutResolution.bracket.length
      ? buildKnockoutResolutionContext(knockoutResolution)
      : null;

  return resolveGameRoomNavTarget(now, worldCupSchedule, games, knockoutContext);
}

export async function resolveGameRoomNavHrefClient(now = new Date()): Promise<string> {
  const target = await resolveGameRoomNavTargetClient(now);
  return target.href;
}
