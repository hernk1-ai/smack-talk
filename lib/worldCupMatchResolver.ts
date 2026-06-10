import {
  getWorldCupKickoffIso,
  getWorldCupMatchId,
  worldCupSchedule,
  type WorldCupMatch,
} from "@/data/worldCupSchedule";
import { getWorldCupMatchStatus, type WorldCupMatchLifecycle } from "@/lib/worldCupMatchStatus";

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

/** The match that is currently live (earliest kickoff if several overlap), or null. */
export function getCurrentLiveWorldCupMatch(
  now: Date = new Date(),
  schedule: WorldCupMatch[] = worldCupSchedule,
): WorldCupMatch | null {
  return (
    getWorldCupScheduleByKickoff(schedule).find((match) => getWorldCupMatchStatus(match, now) === "live") ?? null
  );
}

/** The next match that has not kicked off yet (soonest kickoff), or null. */
export function getNextWorldCupMatch(
  now: Date = new Date(),
  schedule: WorldCupMatch[] = worldCupSchedule,
): WorldCupMatch | null {
  return (
    getWorldCupScheduleByKickoff(schedule).find((match) => getWorldCupMatchStatus(match, now) === "upcoming") ?? null
  );
}

/** Live match if one exists, otherwise the next upcoming match, otherwise null. */
export function getCurrentOrNextWorldCupMatch(
  now: Date = new Date(),
  schedule: WorldCupMatch[] = worldCupSchedule,
): WorldCupMatch | null {
  return getCurrentLiveWorldCupMatch(now, schedule) ?? getNextWorldCupMatch(now, schedule);
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
): GameRoomNavTarget {
  const live = getCurrentLiveWorldCupMatch(now, schedule);
  if (live) {
    return { match: live, lifecycle: "live", href: `/game/${getWorldCupMatchId(live)}` };
  }

  const next = getNextWorldCupMatch(now, schedule);
  if (next) {
    return { match: next, lifecycle: "upcoming", href: `/game/${getWorldCupMatchId(next)}` };
  }

  return { match: null, lifecycle: null, href: SCHEDULE_FALLBACK_ROUTE };
}

/** Convenience: just the resolved Game Room route string. */
export function resolveGameRoomNavHref(now: Date = new Date(), schedule: WorldCupMatch[] = worldCupSchedule): string {
  return resolveGameRoomNavTarget(now, schedule).href;
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
