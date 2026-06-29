import { getWorldCupKickoffIso, getWorldCupMatchId, worldCupSchedule, type WorldCupMatch } from "@/data/worldCupSchedule";
import { scheduleStatusFromFeed } from "@/lib/worldCup/matchSelection";

/** Display lifecycle for a schedule row. */
export type ScheduleMatchStatus = "upcoming" | "live" | "final" | "awaiting_result";

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
  starts_at?: string | null;
  clock?: string | null;
  period?: string | null;
  event_name?: string | null;
};

/** Map a games.status value (scheduled | live | final) to a display status. */
function normalizeDbStatus(
  status: string,
  startsAt: string | null | undefined,
  now: Date,
  feed?: { clock?: string | null; period?: string | null; event_name?: string | null },
): ScheduleMatchStatus {
  return scheduleStatusFromFeed(status, startsAt, now, feed);
}

function scheduleFallbackStatus(match: WorldCupMatch, now: Date): ScheduleMatchStatus {
  const kickoffIso = getWorldCupKickoffIso(match);
  if (!kickoffIso) {
    return "upcoming";
  }

  const kickoffMs = new Date(kickoffIso).getTime();
  if (!Number.isFinite(kickoffMs)) {
    return "upcoming";
  }

  if (now.getTime() < kickoffMs) {
    return "upcoming";
  }

  return "awaiting_result";
}

/**
 * Resolve a single match's display state.
 * Prefers the live games-table row when available; without feed data, never
 * infers live from kickoff time alone.
 */
export function resolveScheduleMatchState(
  match: WorldCupMatch,
  gameRow: ScheduleGameRow | undefined,
  now: Date = new Date(),
): ScheduleMatchState {
  if (gameRow) {
    const startsAt = gameRow.starts_at ?? getWorldCupKickoffIso(match);
    const status = normalizeDbStatus(gameRow.status, startsAt, now, gameRow);

    return {
      status,
      homeScore: gameRow.home_score,
      awayScore: gameRow.away_score,
    };
  }

  return { status: scheduleFallbackStatus(match, now), homeScore: null, awayScore: null };
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
