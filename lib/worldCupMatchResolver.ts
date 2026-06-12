import {
  getWorldCupKickoffIso,
  getWorldCupMatchId,
  worldCupSchedule,
  type WorldCupMatch,
} from "@/data/worldCupSchedule";
import { getEstimatedMatchDisplay, getWorldCupMatchStatus, type WorldCupMatchLifecycle } from "@/lib/worldCupMatchStatus";
import type { Game } from "@/lib/supabase/types";

/** Live window fallback when DB status lags behind kickoff (2.5 hours). */
export const LIVE_MATCH_WINDOW_MINUTES = 150;

export type WorldCupGameSnapshot = Pick<
  Game,
  "id" | "status" | "starts_at" | "home_score" | "away_score" | "home_team" | "away_team" | "clock" | "period" | "event_name"
>;

/**
 * Static-schedule resolvers for the World Cup. The local schedule in
 * `data/worldCupSchedule.ts` is the source of truth and is always available,
 * so these resolvers never depend on a live network call and cannot throw.
 * Any live-data layer (Supabase/feed) should treat these as the safe fallback.
 */

export const SCHEDULE_FALLBACK_ROUTE = "/schedule";

function kickoffMs(match: WorldCupMatch): number {
  const iso = getWorldCupKickoffIso(match);
  return iso ? new Date(iso).getTime() : Number.POSITIVE_INFINITY;
}

/** Schedule sorted by real kickoff time (ascending). Matches without a parseable kickoff sort last. */
export function getWorldCupScheduleByKickoff(schedule: WorldCupMatch[] = worldCupSchedule): WorldCupMatch[] {
  return [...schedule].sort((a, b) => {
    const delta = kickoffMs(a) - kickoffMs(b);
    return delta !== 0 ? delta : a.id - b.id;
  });
}

const LIVE_DB_STATUSES = new Set(["live", "in_progress", "halftime", "first_half", "second_half"]);
const FINAL_DB_STATUSES = new Set(["final", "finished"]);

export function isLiveDbGameStatus(status: string | null | undefined): boolean {
  if (!status) {
    return false;
  }

  return LIVE_DB_STATUSES.has(status.toLowerCase());
}

export function isFinalDbGameStatus(status: string | null | undefined): boolean {
  if (!status) {
    return false;
  }

  return FINAL_DB_STATUSES.has(status.toLowerCase());
}

function isWithinLiveKickoffWindow(
  kickoffIso: string | null,
  now: Date,
  windowMinutes = LIVE_MATCH_WINDOW_MINUTES,
): boolean {
  if (!kickoffIso) {
    return false;
  }

  const kickoffMs = new Date(kickoffIso).getTime();
  if (!Number.isFinite(kickoffMs)) {
    return false;
  }

  const nowMs = now.getTime();
  return nowMs >= kickoffMs && nowMs <= kickoffMs + windowMinutes * 60 * 1000;
}

/** Resolve lifecycle using DB status when available, with schedule/time fallback. */
export function resolveWorldCupMatchLifecycle(
  match: WorldCupMatch,
  now: Date = new Date(),
  game?: WorldCupGameSnapshot | null,
): WorldCupMatchLifecycle {
  if (game) {
    if (isLiveDbGameStatus(game.status)) {
      return "live";
    }

    if (isFinalDbGameStatus(game.status)) {
      return "finished";
    }
  }

  const kickoffIso = getWorldCupKickoffIso(match) ?? game?.starts_at ?? null;
  if (isWithinLiveKickoffWindow(kickoffIso, now) && !isFinalDbGameStatus(game?.status)) {
    return "live";
  }

  return getWorldCupMatchStatus(match, now, LIVE_MATCH_WINDOW_MINUTES);
}

function gamesByMatchId(games: WorldCupGameSnapshot[] = []) {
  return new Map(games.map((game) => [game.id, game]));
}

function findLiveMatches(
  now: Date,
  schedule: WorldCupMatch[],
  games: WorldCupGameSnapshot[] = [],
) {
  const gameMap = gamesByMatchId(games);

  return getWorldCupScheduleByKickoff(schedule)
    .map((match) => ({
      match,
      game: gameMap.get(getWorldCupMatchId(match)) ?? null,
      lifecycle: resolveWorldCupMatchLifecycle(match, now, gameMap.get(getWorldCupMatchId(match))),
    }))
    .filter((entry) => entry.lifecycle === "live");
}

/** The match that is currently live (earliest kickoff if several overlap), or null. */
export function getCurrentLiveWorldCupMatch(
  now: Date = new Date(),
  schedule: WorldCupMatch[] = worldCupSchedule,
  games: WorldCupGameSnapshot[] = [],
): WorldCupMatch | null {
  const liveMatches = findLiveMatches(now, schedule, games);
  if (liveMatches.length) {
    return liveMatches[0]?.match ?? null;
  }

  return (
    getWorldCupScheduleByKickoff(schedule).find(
      (match) => getWorldCupMatchStatus(match, now, LIVE_MATCH_WINDOW_MINUTES) === "live",
    ) ?? null
  );
}

export function getCurrentLiveWorldCupMatchWithGame(
  now: Date = new Date(),
  schedule: WorldCupMatch[] = worldCupSchedule,
  games: WorldCupGameSnapshot[] = [],
): { match: WorldCupMatch; game: WorldCupGameSnapshot | null } | null {
  const liveMatches = findLiveMatches(now, schedule, games);
  if (!liveMatches.length) {
    const match = getCurrentLiveWorldCupMatch(now, schedule, games);
    if (!match) {
      return null;
    }

    const gameMap = gamesByMatchId(games);
    return { match, game: gameMap.get(getWorldCupMatchId(match)) ?? null };
  }

  const first = liveMatches[0];
  return { match: first.match, game: first.game };
}

/** The next match that has not kicked off yet (soonest kickoff), or null. */
export function getNextWorldCupMatch(
  now: Date = new Date(),
  schedule: WorldCupMatch[] = worldCupSchedule,
  games: WorldCupGameSnapshot[] = [],
): WorldCupMatch | null {
  return (
    getWorldCupScheduleByKickoff(schedule).find(
      (match) => resolveWorldCupMatchLifecycle(match, now, gamesByMatchId(games).get(getWorldCupMatchId(match))) === "upcoming",
    ) ?? null
  );
}

/** Live match if one exists, otherwise the next upcoming match, otherwise null. */
export function getCurrentOrNextWorldCupMatch(
  now: Date = new Date(),
  schedule: WorldCupMatch[] = worldCupSchedule,
  games: WorldCupGameSnapshot[] = [],
): WorldCupMatch | null {
  return getCurrentLiveWorldCupMatch(now, schedule, games) ?? getNextWorldCupMatch(now, schedule, games);
}

export type MatchHubFocus =
  | { mode: "live"; match: WorldCupMatch; game: WorldCupGameSnapshot | null }
  | { mode: "upcoming"; match: WorldCupMatch }
  | { mode: "recent-final"; match: WorldCupMatch; game: WorldCupGameSnapshot | null }
  | { mode: "fallback"; match: WorldCupMatch };

/** Priority: live match → next upcoming → most recent final → schedule fallback. */
export function getMatchHubFocus(
  now: Date = new Date(),
  schedule: WorldCupMatch[] = worldCupSchedule,
  games: WorldCupGameSnapshot[] = [],
): MatchHubFocus {
  const live = getCurrentLiveWorldCupMatchWithGame(now, schedule, games);
  if (live) {
    return { mode: "live", match: live.match, game: live.game };
  }

  const next = getNextWorldCupMatch(now, schedule, games);
  if (next) {
    return { mode: "upcoming", match: next };
  }

  const gameMap = gamesByMatchId(games);
  const recentFinal =
    [...getWorldCupScheduleByKickoff(schedule)]
      .reverse()
      .find((match) => resolveWorldCupMatchLifecycle(match, now, gameMap.get(getWorldCupMatchId(match))) === "finished") ??
    null;

  if (recentFinal) {
    return { mode: "recent-final", match: recentFinal, game: gameMap.get(getWorldCupMatchId(recentFinal)) ?? null };
  }

  return { mode: "fallback", match: getWorldCupScheduleByKickoff(schedule)[0] ?? schedule[0] };
}

export function getLiveMatchStatusLabel(match: WorldCupMatch, game: WorldCupGameSnapshot | null, now = new Date()) {
  if (game?.clock?.trim()) {
    return game.period?.trim() ? `${game.period} · ${game.clock}` : game.clock;
  }

  return getEstimatedMatchDisplay(match, now) ?? (game?.status === "live" ? "LIVE" : "Match live");
}

export type GameRoomNavTarget = {
  match: WorldCupMatch | null;
  lifecycle: WorldCupMatchLifecycle | null;
  /** Always a valid in-app route. Falls back to the schedule when no match is resolvable. */
  href: string;
};

/**
 * Resolve where the "Game Room" nav should point:
 * - live match  -> that match's game room
 * - else next upcoming match -> its game room
 * - else (nothing resolvable) -> the schedule page (safe fallback)
 */
export function resolveGameRoomNavTarget(
  now: Date = new Date(),
  schedule: WorldCupMatch[] = worldCupSchedule,
  games: WorldCupGameSnapshot[] = [],
): GameRoomNavTarget {
  const live = getCurrentLiveWorldCupMatch(now, schedule, games);
  if (live) {
    return { match: live, lifecycle: "live", href: `/game/${getWorldCupMatchId(live)}` };
  }

  const next = getNextWorldCupMatch(now, schedule, games);
  if (next) {
    return { match: next, lifecycle: "upcoming", href: `/game/${getWorldCupMatchId(next)}` };
  }

  return { match: null, lifecycle: null, href: SCHEDULE_FALLBACK_ROUTE };
}

/** Convenience: just the resolved Game Room route string. */
export function resolveGameRoomNavHref(
  now: Date = new Date(),
  schedule: WorldCupMatch[] = worldCupSchedule,
  games: WorldCupGameSnapshot[] = [],
): string {
  return resolveGameRoomNavTarget(now, schedule, games).href;
}

const GAME_ROOM_ROUTE_PATTERN = /^\/game\/wc-2026-\d+$/;

export type NavCheck = { name: string; pass: boolean; detail: string };

/**
 * Console-safe validation of the resolvers. Returns structured checks instead of
 * throwing so it can run in a dev route, a script, or a quick test. Verifies:
 * - the live-match resolver works (synthetic "during match #1" clock)
 * - the next-match resolver works (synthetic "before any kickoff" clock)
 * - the nav route resolves to a valid in-app route
 * - the fallback works when the schedule is empty (API/data unavailable)
 */
export function validateWorldCupNav(): { ok: boolean; checks: NavCheck[] } {
  const checks: NavCheck[] = [];
  const opener = getWorldCupScheduleByKickoff()[0] ?? null;

  // 1) Next-match resolver: well before the first kickoff, nav points to the opener.
  const beforeAll = opener
    ? new Date(new Date(getWorldCupKickoffIso(opener) ?? Date.now()).getTime() - 60 * 60 * 1000)
    : new Date();
  const beforeTarget = resolveGameRoomNavTarget(beforeAll);
  checks.push({
    name: "next-match resolver",
    pass: Boolean(opener) && beforeTarget.lifecycle === "upcoming" && beforeTarget.match?.id === opener?.id,
    detail: `before kickoff → ${beforeTarget.href} (${beforeTarget.lifecycle ?? "none"})`,
  });

  // 2) Live-match resolver: just after the first kickoff, nav points to the live opener.
  const duringOpener = opener
    ? new Date(new Date(getWorldCupKickoffIso(opener) ?? Date.now()).getTime() + 10 * 60 * 1000)
    : new Date();
  const liveTarget = resolveGameRoomNavTarget(duringOpener);
  checks.push({
    name: "live-match resolver",
    pass: Boolean(opener) && liveTarget.lifecycle === "live" && liveTarget.match?.id === opener?.id,
    detail: `at kickoff → ${liveTarget.href} (${liveTarget.lifecycle ?? "none"})`,
  });

  // 3) Nav route is a valid game-room route in both states above.
  checks.push({
    name: "nav route is valid",
    pass: GAME_ROOM_ROUTE_PATTERN.test(beforeTarget.href) && GAME_ROOM_ROUTE_PATTERN.test(liveTarget.href),
    detail: `routes: ${beforeTarget.href}, ${liveTarget.href}`,
  });

  // 4) Fallback when no schedule data is available (simulating a total data/API outage).
  const fallback = resolveGameRoomNavTarget(new Date(), []);
  checks.push({
    name: "empty-data fallback",
    pass: fallback.href === SCHEDULE_FALLBACK_ROUTE && fallback.match === null,
    detail: `no matches → ${fallback.href}`,
  });

  return { ok: checks.every((check) => check.pass), checks };
}
