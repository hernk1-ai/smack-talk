import { getArenaGames } from "@/lib/supabase/games";
import { worldCupSchedule } from "@/data/worldCupSchedule";
import {
  resolveGameRoomNavTarget,
  type GameRoomNavTarget,
  type WorldCupGameSnapshot,
} from "@/lib/worldCupMatchResolver";

function isWorldCupGameRow(game: { id: string; league?: string | null }) {
  return game.league === "World Cup" || game.id.startsWith("wc-2026-");
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

/** Resolve Game Room nav using live DB rows when available. */
export async function resolveGameRoomNavTargetClient(now = new Date()): Promise<GameRoomNavTarget> {
  const games = await fetchWorldCupGameSnapshots();
  if (games.length === 0) {
    console.warn("[lockt:game-room-select] No World Cup feed rows loaded; falling back to static schedule.");
  }
  return resolveGameRoomNavTarget(now, worldCupSchedule, games);
}

export async function resolveGameRoomNavHrefClient(now = new Date()): Promise<string> {
  const target = await resolveGameRoomNavTargetClient(now);
  return target.href;
}
