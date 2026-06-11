import { getWorldCupMatchId, worldCupSchedule, type WorldCupMatch } from "@/data/worldCupSchedule";
import { getWorldCupMatchStatus } from "@/lib/worldCupMatchStatus";

/** Display lifecycle for a schedule row. `scheduled` maps to `upcoming`. */
export type ScheduleMatchStatus = "upcoming" | "live" | "final";

export type ScheduleMatchState = {
  status: ScheduleMatchStatus;
  homeScore: number | null;
  awayScore: number | null;
};

/** Minimal shape read from the public.games table for the schedule. */
export type ScheduleGameRow = {
  id: string;
  status: string;
  home_score: number;
  away_score: number;
};

/** Map a games.status value (scheduled | live | final) to a display status. */
function normalizeDbStatus(status: string): ScheduleMatchStatus {
  if (status === "final") return "final";
  if (status === "live") return "live";
  return "upcoming";
}

/**
 * Resolve a single match's display state.
 * Prefers the live games-table row when available; otherwise falls back to a
 * status derived from kickoff time so the schedule is always correct even when
 * Supabase/game-row data is unavailable.
 */
export function resolveScheduleMatchState(
  match: WorldCupMatch,
  gameRow: ScheduleGameRow | undefined,
  now: Date = new Date(),
): ScheduleMatchState {
  if (gameRow) {
    return {
      status: normalizeDbStatus(gameRow.status),
      homeScore: gameRow.home_score,
      awayScore: gameRow.away_score,
    };
  }

  const lifecycle = getWorldCupMatchStatus(match, now);
  const status: ScheduleMatchStatus = lifecycle === "finished" ? "final" : lifecycle;
  return { status, homeScore: null, awayScore: null };
}

/**
 * Build a complete match.id -> display state map by merging live game rows with
 * the static schedule. Every match in the schedule gets an entry.
 */
export function buildScheduleMatchStates(
  gameRows: ScheduleGameRow[],
  now: Date = new Date(),
  schedule: WorldCupMatch[] = worldCupSchedule,
): Record<number, ScheduleMatchState> {
  const rowsByGameId = new Map(gameRows.map((row) => [row.id, row]));
  const states: Record<number, ScheduleMatchState> = {};

  for (const match of schedule) {
    states[match.id] = resolveScheduleMatchState(match, rowsByGameId.get(getWorldCupMatchId(match)), now);
  }

  return states;
}
