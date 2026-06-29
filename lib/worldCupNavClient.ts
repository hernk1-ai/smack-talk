import { getArenaGames } from "@/lib/supabase/games";
import { worldCupSchedule } from "@/data/worldCupSchedule";
import {
  buildResolvedMatchContext,
  withResolvedMatchGames,
  type ResolvedMatchContextInput,
} from "@/lib/worldCup/resolvedMatch";
import {
  resolveGameRoomNavTarget,
  type GameRoomNavTarget,
  type WorldCupGameSnapshot,
} from "@/lib/worldCupMatchResolver";

const EMPTY_MATCH_CONTEXT: ResolvedMatchContextInput = {
  knockoutResolution: { standings: [], bracket: [] },
  games: [],
};

function isWorldCupGameRow(game: { id: string; league?: string | null }) {
  return game.league === "World Cup" || game.id.startsWith("wc-2026-");
}

export async function fetchMatchContextInput(): Promise<ResolvedMatchContextInput> {
  try {
    const response = await fetch("/api/world-cup/match-context", { cache: "no-store" });
    if (response.ok) {
      return (await response.json()) as ResolvedMatchContextInput;
    }
  } catch (error) {
    console.warn("[lockt:match-context] Failed to load match context:", error);
  }

  return EMPTY_MATCH_CONTEXT;
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

/** Resolve Game Room nav using the same canonical live/next logic as the Schedule page. */
export async function resolveGameRoomNavTargetClient(now = new Date()): Promise<GameRoomNavTarget> {
  const [games, matchContextInput] = await Promise.all([
    fetchWorldCupGameSnapshots(),
    fetchMatchContextInput(),
  ]);

  if (games.length === 0) {
    console.warn("[lockt:game-room-select] No World Cup feed rows loaded; falling back to static schedule.");
  }

  const resolvedContext = withResolvedMatchGames(
    buildResolvedMatchContext({ ...matchContextInput, nowIso: now.toISOString() }),
    games,
    now,
  );

  return resolveGameRoomNavTarget(now, worldCupSchedule, games, resolvedContext);
}

export async function resolveGameRoomNavHrefClient(now = new Date()): Promise<string> {
  const target = await resolveGameRoomNavTargetClient(now);
  return target.href;
}
