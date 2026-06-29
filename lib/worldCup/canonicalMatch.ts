import { getWorldCupMatchId, type WorldCupMatch } from "@/data/worldCupSchedule";
import { getKickoffMs } from "@/lib/worldCup/localSchedule";
import { isKnockoutScheduleMatch, type KnockoutResolutionContext } from "@/lib/worldCup/knockoutMatchResolver";
import { resolveMatchDisplay } from "@/lib/worldCup/matchDisplay";
import { isSelectableScheduleState } from "@/lib/worldCup/matchSelection";
import {
  buildScheduleMatchStates,
  type ScheduleGameRow,
  type ScheduleMatchState,
} from "@/lib/worldCup/scheduleStatus";
import type { WorldCupGameSnapshot } from "@/lib/worldCupMatchResolver";

export type CanonicalMatchFocus =
  | { mode: "live"; match: WorldCupMatch }
  | { mode: "upcoming"; match: WorldCupMatch }
  | { mode: "complete" };

function sortByScheduleKickoff(schedule: WorldCupMatch[]): WorldCupMatch[] {
  return [...schedule].sort((left, right) => getKickoffMs(left) - getKickoffMs(right) || left.id - right.id);
}

/**
 * Prefer the first upcoming match that is group stage or a resolved knockout slot.
 * Skips unresolved knockout placeholders when a later resolved match exists.
 */
function pickCanonicalUpcomingMatch(
  upcoming: WorldCupMatch[],
  knockoutContext?: KnockoutResolutionContext | null,
): WorldCupMatch | null {
  if (!upcoming.length) {
    return null;
  }

  for (const match of upcoming) {
    if (!isKnockoutScheduleMatch(match)) {
      return match;
    }

    if (resolveMatchDisplay(match, knockoutContext).isResolved) {
      return match;
    }
  }

  return upcoming[0];
}

/**
 * Canonical live/next match selection — mirrors the Schedule page:
 * schedule kickoff ordering + schedule match states (not feed-only lifecycle).
 */
export function getCanonicalCurrentOrNextMatch(
  schedule: WorldCupMatch[],
  matchStates: Record<number, ScheduleMatchState>,
  knockoutContext?: KnockoutResolutionContext | null,
  now: Date = new Date(),
): CanonicalMatchFocus {
  const sorted = sortByScheduleKickoff(schedule);

  const liveMatch = sorted.find((match) => matchStates[match.id]?.status === "live");
  if (liveMatch) {
    return { mode: "live", match: liveMatch };
  }

  const upcoming = sorted.filter((match) => {
    const state = matchStates[match.id];
    return state ? isSelectableScheduleState(state, match, now) : false;
  });
  const nextMatch = pickCanonicalUpcomingMatch(upcoming, knockoutContext);
  if (nextMatch) {
    return { mode: "upcoming", match: nextMatch };
  }

  return { mode: "complete" };
}

export function buildScheduleMatchStatesFromSnapshots(
  games: WorldCupGameSnapshot[],
  now: Date = new Date(),
  schedule: WorldCupMatch[],
): Record<number, ScheduleMatchState> {
  const rows: ScheduleGameRow[] = games.map((game) => ({
    id: game.id,
    status: game.status,
    home_score: game.home_score,
    away_score: game.away_score,
    starts_at: game.starts_at,
    clock: game.clock,
    period: game.period,
    event_name: game.event_name,
  }));

  return buildScheduleMatchStates(rows, now, schedule);
}

export function getCanonicalCurrentOrNextMatchFromGames(
  schedule: WorldCupMatch[],
  games: WorldCupGameSnapshot[],
  knockoutContext?: KnockoutResolutionContext | null,
  now: Date = new Date(),
): CanonicalMatchFocus {
  const matchStates = buildScheduleMatchStatesFromSnapshots(games, now, schedule);
  return getCanonicalCurrentOrNextMatch(schedule, matchStates, knockoutContext, now);
}

export function getCanonicalMatchGameId(
  focus: CanonicalMatchFocus,
): string | null {
  if (focus.mode === "complete") {
    return null;
  }

  return getWorldCupMatchId(focus.match);
}
