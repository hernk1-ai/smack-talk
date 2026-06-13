import { getWorldCupKickoffIso, type WorldCupMatch } from "@/data/worldCupSchedule";

/** Deterministic timezone for SSR + first client paint (matches schedule page). */
export const WORLD_CUP_SCHEDULE_FALLBACK_TIME_ZONE = "America/New_York";

/** Absolute kickoff instant (UTC) for a match; equals games.starts_at. */
export function getKickoffMs(match: WorldCupMatch): number {
  const iso = getWorldCupKickoffIso(match);
  const ms = iso ? new Date(iso).getTime() : Number.NaN;
  return Number.isFinite(ms) ? ms : Number.MAX_SAFE_INTEGER;
}

export function getLocalDateKeyForInstant(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/** Sortable local calendar-day key (YYYY-MM-DD) in the given timezone. */
export function getLocalDateKey(match: WorldCupMatch, timeZone: string): string {
  const iso = getWorldCupKickoffIso(match);
  if (!iso) {
    return "9999-12-31";
  }

  return getLocalDateKeyForInstant(iso, timeZone);
}

export function getTodayLocalDateKey(timeZone: string, now = new Date()): string {
  return getLocalDateKeyForInstant(now.toISOString(), timeZone);
}

/** Human day header (e.g. "Saturday, June 13") in the given timezone. */
export function getLocalDateLabel(match: WorldCupMatch, timeZone: string): string {
  const iso = getWorldCupKickoffIso(match);
  if (!iso) {
    return "Date TBD";
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

/** Local kickoff time (e.g. "9:00 PM") in the given timezone. */
export function formatLocalKickoff(match: WorldCupMatch, timeZone: string): string {
  const iso = getWorldCupKickoffIso(match);
  if (!iso) {
    return match.kickoffET;
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
