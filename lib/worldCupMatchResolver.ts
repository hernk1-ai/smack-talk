import {
  getWorldCupKickoffIso,
  getWorldCupMatchId,
  worldCupSchedule,
  type WorldCupMatch,
} from "@/data/worldCupSchedule";
import {
  getCanonicalCurrentOrNextMatchFromGames,
} from "@/lib/worldCup/canonicalMatch";
import {
  isFeedGameFinal,
  isFeedGameLive,
  resolveFeedGameStatus,
  STALE_LIVE_FALLBACK_MS,
} from "@/lib/worldCup/gameStatus";
import type { ResolvedMatchContext } from "@/lib/worldCup/resolvedMatch";
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

function gameRoomHref(gameId: string) {
  return `/game/${gameId}`;
}

/** The match that is currently live (earliest kickoff if several overlap), or null. */
export function getCurrentLiveWorldCupMatch(
  now: Date = new Date(),
  schedule: WorldCupMatch[] = worldCupSchedule,
  games: WorldCupGameSnapshot[] = [],
  resolvedContext?: ResolvedMatchContext | null,
): WorldCupMatch | null {
  const focus = getCanonicalCurrentOrNextMatchFromGames(schedule, games, resolvedContext, now);
  return focus.mode === "live" ? focus.match : null;
}

export function getCurrentLiveWorldCupMatchWithGame(
  now: Date = new Date(),
  schedule: WorldCupMatch[] = worldCupSchedule,
  games: WorldCupGameSnapshot[] = [],
  resolvedContext?: ResolvedMatchContext | null,
): { match: WorldCupMatch; game: WorldCupGameSnapshot | null } | null {
  const focus = getCanonicalCurrentOrNextMatchFromGames(schedule, games, resolvedContext, now);
  if (focus.mode !== "live") {
    return null;
  }

  return {
    match: focus.match,
    game: gamesByMatchId(games).get(getWorldCupMatchId(focus.match)) ?? null,
  };
}

/** The next match that has not kicked off yet (soonest kickoff), or null. */
export function getNextWorldCupMatch(
  now: Date = new Date(),
  schedule: WorldCupMatch[] = worldCupSchedule,
  games: WorldCupGameSnapshot[] = [],
  resolvedContext?: ResolvedMatchContext | null,
): WorldCupMatch | null {
  const focus = getCanonicalCurrentOrNextMatchFromGames(schedule, games, resolvedContext, now);
  return focus.mode === "upcoming" ? focus.match : null;
}

/** Live match if one exists, otherwise the next upcoming match, otherwise null. */
export function getCurrentOrNextWorldCupMatch(
  now: Date = new Date(),
  schedule: WorldCupMatch[] = worldCupSchedule,
  games: WorldCupGameSnapshot[] = [],
  resolvedContext?: ResolvedMatchContext | null,
): WorldCupMatch | null {
  const focus = getCanonicalCurrentOrNextMatchFromGames(schedule, games, resolvedContext, now);
  return focus.mode === "complete" ? null : focus.match;
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
  resolvedContext?: ResolvedMatchContext | null,
): MatchHubFocus {
  const focus = getCanonicalCurrentOrNextMatchFromGames(schedule, games, resolvedContext, now);

  if (focus.mode === "live") {
    return {
      mode: "live",
      match: focus.match,
      game: gamesByMatchId(games).get(getWorldCupMatchId(focus.match)) ?? null,
    };
  }

  if (focus.mode === "upcoming") {
    return { mode: "upcoming", match: focus.match };
  }

  return { mode: "complete" };
}

export function getLiveMatchStatusLabel(match: WorldCupMatch, game: WorldCupGameSnapshot | null, now = new Date()) {
  if (game?.clock?.trim()) {
    return game.period?.trim() ? `${game.period} · ${game.clock}` : game.clock;
  }

  return getEstimatedMatchDisplay(match, now) ?? (game?.status === "live" ? "LIVE" : "Match live");
}

export type GameRoomSelectionReason = "live-selected" | "next-scheduled-selected" | "schedule-fallback" | "none";

export type GameRoomNavTarget = {
  match: WorldCupMatch | null;
  game: WorldCupGameSnapshot | null;
  lifecycle: WorldCupMatchLifecycle | null;
  /** Always a valid in-app route. Falls back to the schedule when no match is resolvable. */
  href: string;
  selectionReason: GameRoomSelectionReason;
};

export function logGameRoomSelection(target: GameRoomNavTarget, now: Date = new Date()) {
  const game = target.game;
  const teams = game
    ? `${game.home_team} vs ${game.away_team ?? "TBD"}`
    : target.match
      ? `${target.match.homeTeam} vs ${target.match.awayTeam ?? "TBD"}`
      : null;

  console.info("[lockt:game-room-select]", {
    selectedGameId: game?.id ?? (target.match ? getWorldCupMatchId(target.match) : null),
    selectedTeams: teams,
    selectedStatus: game?.status ?? null,
    startsAt: game?.starts_at ?? null,
    reason: target.selectionReason,
    href: target.href,
    at: now.toISOString(),
  });
}

/**
 * Resolve where the "Game Room" nav should point using the same canonical
 * live/next selection as the Schedule page.
 */
export function resolveGameRoomNavTarget(
  now: Date = new Date(),
  schedule: WorldCupMatch[] = worldCupSchedule,
  games: WorldCupGameSnapshot[] = [],
  resolvedContext?: ResolvedMatchContext | null,
): GameRoomNavTarget {
  const focus = getCanonicalCurrentOrNextMatchFromGames(schedule, games, resolvedContext, now);

  if (focus.mode === "live" || focus.mode === "upcoming") {
    const gameId = getWorldCupMatchId(focus.match);
    const target: GameRoomNavTarget = {
      match: focus.match,
      game: gamesByMatchId(games).get(gameId) ?? null,
      lifecycle: focus.mode === "live" ? "live" : "upcoming",
      href: gameRoomHref(gameId),
      selectionReason: focus.mode === "live" ? "live-selected" : "next-scheduled-selected",
    };
    logGameRoomSelection(target, now);
    return target;
  }

  const target: GameRoomNavTarget = {
    match: null,
    game: null,
    lifecycle: null,
    href: SCHEDULE_FALLBACK_ROUTE,
    selectionReason: "none",
  };
  logGameRoomSelection(target, now);
  return target;
}

/** Convenience: just the resolved Game Room route string. */
export function resolveGameRoomNavHref(
  now: Date = new Date(),
  schedule: WorldCupMatch[] = worldCupSchedule,
  games: WorldCupGameSnapshot[] = [],
  resolvedContext?: ResolvedMatchContext | null,
): string {
  return resolveGameRoomNavTarget(now, schedule, games, resolvedContext).href;
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
    pass:
      navTarget.lifecycle === "live" &&
      navTarget.selectionReason === "live-selected" &&
      navTarget.game?.id === (turPar ? getWorldCupMatchId(turPar) : null),
    detail: `${navTarget.href} (${navTarget.lifecycle ?? "none"} · ${navTarget.selectionReason})`,
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

  const beforeTunJpn = tunJpn
    ? new Date(new Date(getWorldCupKickoffIso(tunJpn) ?? Date.now()).getTime() - 15 * 60 * 1000)
    : now;
  const czeMex = schedule.find((match) => match.id === 31) ?? null;
  const upcomingOnlyGames: WorldCupGameSnapshot[] = [
    ...(tunJpn ? [buildGameSnapshot(tunJpn, "scheduled")] : []),
    ...(czeMex ? [buildGameSnapshot(czeMex, "final", { home_score: 1, away_score: 0 })] : []),
    ...(braHai ? [buildGameSnapshot(braHai, "final", { home_score: 2, away_score: 1 })] : []),
    ...(scoMar ? [buildGameSnapshot(scoMar, "final", { home_score: 0, away_score: 1 })] : []),
  ];
  const withoutLive = resolveGameRoomNavTarget(beforeTunJpn, schedule, upcomingOnlyGames);
  checks.push({
    name: "Tunisia vs Japan scheduled only when no live match exists",
    pass:
      withoutLive.lifecycle === "upcoming" &&
      withoutLive.selectionReason === "next-scheduled-selected" &&
      withoutLive.match?.id === tunJpn?.id,
    detail: `${withoutLive.href} (${withoutLive.lifecycle ?? "none"} · ${withoutLive.selectionReason})`,
  });

  const braHaiLive = braHai ?? null;
  const nedSwe = schedule.find((match) => match.id === 35) ?? null;
  const duringBraHaiLive = braHaiLive
    ? new Date(new Date(getWorldCupKickoffIso(braHaiLive) ?? Date.now()).getTime() + 30 * 60 * 1000)
    : new Date("2026-06-19T21:00:00-04:00");
  const staleLiveGames: WorldCupGameSnapshot[] = [
    ...(braHaiLive
      ? [
          buildGameSnapshot(braHaiLive, "live", {
            starts_at: getWorldCupKickoffIso(braHaiLive),
            home_score: 1,
            away_score: 0,
            clock: "62'",
            period: "2nd Half",
          }),
        ]
      : []),
    ...(nedSwe ? [buildGameSnapshot(nedSwe, "scheduled")] : []),
  ];
  const staleLiveTarget = resolveGameRoomNavTarget(duringBraHaiLive, schedule, staleLiveGames);

  checks.push({
    name: "stale kickoff live row still wins with active clock",
    pass:
      staleLiveTarget.selectionReason === "live-selected" &&
      staleLiveTarget.match?.id === braHaiLive?.id,
    detail: `${staleLiveTarget.href} (${staleLiveTarget.selectionReason})`,
  });

  checks.push({
    name: "Netherlands vs Sweden not selected while Brazil vs Haiti is live",
    pass: staleLiveTarget.match?.id !== nedSwe?.id,
    detail: `selected=${staleLiveTarget.match?.id ?? "none"}`,
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
