import {
  getWorldCupKickoffIso,
  getWorldCupMatchId,
  worldCupSchedule,
  type WorldCupMatch,
} from "@/data/worldCupSchedule";
import {
  isFeedGameFinal,
  isFeedGameLive,
  resolveFeedGameStatus,
  STALE_LIVE_FALLBACK_MS,
} from "@/lib/worldCup/gameStatus";
import { parseWorldCupRouteGameId } from "@/lib/supabase/resolveArenaGame";
import { getEstimatedMatchDisplay, type WorldCupMatchLifecycle } from "@/lib/worldCupMatchStatus";
import type { Game } from "@/lib/supabase/types";

/** @deprecated Use feed status via resolveWorldCupMatchLifecycle — kept for test imports. */
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

export function isLiveDbGameStatus(status: string | null | undefined): boolean {
  return isFeedGameLive(status, null);
}

export function isFinalDbGameStatus(status: string | null | undefined): boolean {
  return isFeedGameFinal(status, null);
}

function getMatchStartsAt(match: WorldCupMatch, game?: WorldCupGameSnapshot | null): string | null {
  return game?.starts_at ?? getWorldCupKickoffIso(match) ?? null;
}

function getMatchKickoffMs(match: WorldCupMatch, game?: WorldCupGameSnapshot | null): number {
  const startsAt = getMatchStartsAt(match, game);
  const kickoffMs = startsAt ? new Date(startsAt).getTime() : Number.NaN;
  return Number.isFinite(kickoffMs) ? kickoffMs : Number.POSITIVE_INFINITY;
}

/** True when a match is a valid future kickoff candidate (lifecycle upcoming + starts_at > now). */
export function isSelectableUpcomingWorldCupMatch(
  match: WorldCupMatch,
  now: Date = new Date(),
  game?: WorldCupGameSnapshot | null,
): boolean {
  return (
    resolveWorldCupMatchLifecycle(match, now, game) === "upcoming" &&
    getMatchKickoffMs(match, game) > now.getTime()
  );
}

/** Resolve lifecycle from feed status when available; never infers live from kickoff alone. */
export function resolveWorldCupMatchLifecycle(
  match: WorldCupMatch,
  now: Date = new Date(),
  game?: WorldCupGameSnapshot | null,
): WorldCupMatchLifecycle {
  const startsAt = getMatchStartsAt(match, game);
  const kickoffMs = startsAt ? new Date(startsAt).getTime() : Number.NaN;
  const nowMs = now.getTime();
  const hasValidKickoff = Number.isFinite(kickoffMs);

  if (game?.status) {
    const feedStatus = resolveFeedGameStatus(game.status, startsAt, now);
    if (feedStatus === "final") {
      return "finished";
    }
    if (feedStatus === "live") {
      return "live";
    }
    if (hasValidKickoff && nowMs < kickoffMs) {
      return "upcoming";
    }
    return "finished";
  }

  if (!hasValidKickoff) {
    return "upcoming";
  }

  if (nowMs < kickoffMs) {
    return "upcoming";
  }

  if (nowMs > kickoffMs + STALE_LIVE_FALLBACK_MS) {
    return "finished";
  }

  return "finished";
}

function gamesByMatchId(games: WorldCupGameSnapshot[] = []) {
  return new Map(games.map((game) => [game.id, game]));
}

function resolveScheduleMatchForGame(game: WorldCupGameSnapshot, schedule: WorldCupMatch[]): WorldCupMatch | null {
  const parsed = parseWorldCupRouteGameId(game.id);
  if (parsed) {
    return parsed.worldCupMatch;
  }

  return schedule.find((match) => getWorldCupMatchId(match) === game.id) ?? null;
}

function isFeedLiveGameRow(game: WorldCupGameSnapshot, now: Date): boolean {
  return resolveFeedGameStatus(game.status, game.starts_at, now) === "live";
}

/** Live matches from feed rows (games.status), sorted by kickoff ascending. */
function findLiveMatches(
  now: Date,
  schedule: WorldCupMatch[],
  games: WorldCupGameSnapshot[] = [],
) {
  return games
    .filter((game) => isFeedLiveGameRow(game, now))
    .map((game) => ({
      match: resolveScheduleMatchForGame(game, schedule),
      game,
    }))
    .filter((entry): entry is { match: WorldCupMatch; game: WorldCupGameSnapshot } => entry.match !== null)
    .sort(
      (left, right) =>
        getMatchKickoffMs(left.match, left.game) - getMatchKickoffMs(right.match, right.game) ||
        left.match.id - right.match.id,
    );
}

/** The match that is currently live (earliest kickoff if several overlap), or null. */
export function getCurrentLiveWorldCupMatch(
  now: Date = new Date(),
  schedule: WorldCupMatch[] = worldCupSchedule,
  games: WorldCupGameSnapshot[] = [],
): WorldCupMatch | null {
  const liveMatches = findLiveMatches(now, schedule, games);
  return liveMatches[0]?.match ?? null;
}

export function getCurrentLiveWorldCupMatchWithGame(
  now: Date = new Date(),
  schedule: WorldCupMatch[] = worldCupSchedule,
  games: WorldCupGameSnapshot[] = [],
): { match: WorldCupMatch; game: WorldCupGameSnapshot | null } | null {
  const liveMatches = findLiveMatches(now, schedule, games);
  if (!liveMatches.length) {
    return null;
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
  if (getCurrentLiveWorldCupMatch(now, schedule, games)) {
    return null;
  }

  const gameMap = gamesByMatchId(games);

  return (
    getWorldCupScheduleByKickoff(schedule).find((match) =>
      isSelectableUpcomingWorldCupMatch(match, now, gameMap.get(getWorldCupMatchId(match))),
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
  | { mode: "complete" };

/** Priority: live match → next upcoming → tournament complete. */
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

  return { mode: "complete" };
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

function buildGameSnapshot(
  match: WorldCupMatch,
  status: WorldCupGameSnapshot["status"],
  overrides: Partial<WorldCupGameSnapshot> = {},
): WorldCupGameSnapshot {
  return {
    id: getWorldCupMatchId(match),
    status,
    starts_at: getWorldCupKickoffIso(match),
    home_score: 0,
    away_score: 0,
    home_team: match.homeTeam,
    away_team: match.awayTeam ?? "TBD",
    clock: null,
    period: null,
    event_name: null,
    ...overrides,
  };
}

/** Validates Match Hub countdown/focus selection against lifecycle rules. */
export function validateMatchHubSelection(
  schedule: WorldCupMatch[] = worldCupSchedule,
): { ok: boolean; checks: NavCheck[] } {
  const checks: NavCheck[] = [];
  const sorted = getWorldCupScheduleByKickoff(schedule);
  const opener = sorted[0] ?? null;
  const usaAus = sorted.find((match) => match.id === 32) ?? null;
  const jun19Morning = usaAus
    ? new Date(new Date(getWorldCupKickoffIso(usaAus) ?? Date.now()).getTime() - 5 * 60 * 60 * 1000)
    : new Date("2026-06-19T10:00:00-04:00");

  const stalePastGames = sorted
    .filter((match) => {
      const kickoffIso = getWorldCupKickoffIso(match);
      return kickoffIso && new Date(kickoffIso).getTime() < jun19Morning.getTime();
    })
    .map((match) => buildGameSnapshot(match, "scheduled"));

  const finalGames = opener ? [buildGameSnapshot(opener, "final", { home_score: 2, away_score: 1 })] : [];
  const next = getNextWorldCupMatch(jun19Morning, schedule, [...stalePastGames, ...finalGames]);

  checks.push({
    name: "past scheduled match is not selected",
    pass:
      next == null ||
      getMatchKickoffMs(next, stalePastGames.find((game) => game.id === getWorldCupMatchId(next))) > jun19Morning.getTime(),
    detail: next ? `${next.homeTeam} vs ${next.awayTeam ?? "TBD"} · ${next.date}` : "none",
  });

  checks.push({
    name: "final match is not selected",
    pass: next?.id !== opener?.id,
    detail: `next id=${next?.id ?? "none"}`,
  });

  checks.push({
    name: "next future scheduled match is selected",
    pass: Boolean(usaAus) && next?.id === usaAus?.id,
    detail: `expected wc-2026-32, got ${next ? getWorldCupMatchId(next) : "none"}`,
  });

  const liveMatch = usaAus ?? opener;
  const duringLive = liveMatch
    ? new Date(new Date(getWorldCupKickoffIso(liveMatch) ?? Date.now()).getTime() + 10 * 60 * 1000)
    : new Date();
  const liveGame = liveMatch ? buildGameSnapshot(liveMatch, "live", { home_score: 1, away_score: 0, clock: "23'" }) : null;
  const focus = liveMatch && liveGame ? getMatchHubFocus(duringLive, schedule, [liveGame]) : null;

  checks.push({
    name: "live match is selected before future scheduled match",
    pass: focus?.mode === "live" && focus.match.id === liveMatch?.id,
    detail: `focus=${focus?.mode ?? "none"}`,
  });

  return { ok: checks.every((check) => check.pass), checks };
}

/** Validates Game Room nav picks live feed rows over stale scheduled/final matches. */
export function validateGameRoomSelection(
  schedule: WorldCupMatch[] = worldCupSchedule,
): { ok: boolean; checks: NavCheck[] } {
  const checks: NavCheck[] = [];
  const tunJpn = schedule.find((match) => match.id === 36) ?? null;
  const braHai = schedule.find((match) => match.id === 29) ?? null;
  const scoMar = schedule.find((match) => match.id === 30) ?? null;
  const turPar = schedule.find((match) => match.id === 4) ?? null;
  const now = tunJpn
    ? new Date(new Date(getWorldCupKickoffIso(tunJpn) ?? Date.now()).getTime() - 30 * 60 * 1000)
    : new Date("2026-06-20T11:30:00-04:00");
  const liveKickoff = new Date(now.getTime() - 45 * 60 * 1000).toISOString();

  const games: WorldCupGameSnapshot[] = [
    ...(turPar
      ? [
          buildGameSnapshot(turPar, "live", {
            starts_at: liveKickoff,
            home_team: "Türkiye",
            away_team: "Paraguay",
            home_score: 1,
            away_score: 0,
            clock: "37'",
          }),
        ]
      : []),
    ...(braHai ? [buildGameSnapshot(braHai, "final", { home_score: 2, away_score: 1 })] : []),
    ...(scoMar ? [buildGameSnapshot(scoMar, "final", { home_score: 0, away_score: 1 })] : []),
    ...(tunJpn ? [buildGameSnapshot(tunJpn, "scheduled")] : []),
  ];

  const navTarget = resolveGameRoomNavTarget(now, schedule, games);

  checks.push({
    name: "live Türkiye vs Paraguay routes to its game room",
    pass: navTarget.lifecycle === "live" && navTarget.match?.id === turPar?.id,
    detail: `${navTarget.href} (${navTarget.lifecycle ?? "none"})`,
  });

  checks.push({
    name: "Brazil vs Haiti final is not selected",
    pass: navTarget.match?.id !== braHai?.id,
    detail: `selected id=${navTarget.match?.id ?? "none"}`,
  });

  checks.push({
    name: "Scotland vs Morocco final is not selected",
    pass: navTarget.match?.id !== scoMar?.id,
    detail: `selected id=${navTarget.match?.id ?? "none"}`,
  });

  const withoutLive = resolveGameRoomNavTarget(now, schedule, games.filter((game) => game.status !== "live"));
  checks.push({
    name: "Tunisia vs Japan scheduled only when no live match exists",
    pass: withoutLive.lifecycle === "upcoming" && withoutLive.match?.id === tunJpn?.id,
    detail: `${withoutLive.href} (${withoutLive.lifecycle ?? "none"})`,
  });

  return { ok: checks.every((check) => check.pass), checks };
}

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

  // 2) Live-match resolver: feed marks the opener live at kickoff+10min.
  const duringOpener = opener
    ? new Date(new Date(getWorldCupKickoffIso(opener) ?? Date.now()).getTime() + 10 * 60 * 1000)
    : new Date();
  const openerGameId = opener ? getWorldCupMatchId(opener) : "";
  const liveFeedGame: WorldCupGameSnapshot | null = opener
    ? {
        id: openerGameId,
        status: "live",
        starts_at: getWorldCupKickoffIso(opener),
        home_score: 0,
        away_score: 0,
        home_team: opener.homeTeam,
        away_team: opener.awayTeam ?? "TBD",
        clock: null,
        period: null,
        event_name: null,
      }
    : null;
  const liveTarget = resolveGameRoomNavTarget(duringOpener, worldCupSchedule, liveFeedGame ? [liveFeedGame] : []);
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

  const matchHubChecks = validateMatchHubSelection(worldCupSchedule);
  checks.push(...matchHubChecks.checks);

  const gameRoomChecks = validateGameRoomSelection(worldCupSchedule);
  checks.push(...gameRoomChecks.checks);

  return { ok: checks.every((check) => check.pass), checks };
}
