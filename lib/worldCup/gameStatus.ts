/** Feed-backed game status (games.status). Source of truth for live/final transitions. */
export type FeedGameStatus = "scheduled" | "live" | "final";

/** Stale-live safety net: never keep a match live more than 4h after kickoff. */
export const STALE_LIVE_FALLBACK_MS = 4 * 60 * 60 * 1000;

const FINAL_STATUSES = new Set(["final", "finished", "complete", "full_time", "post"]);
const LIVE_STATUSES = new Set([
  "live",
  "in_progress",
  "halftime",
  "first_half",
  "second_half",
]);

/** Normalize a raw games.status (or ESPN-derived) value. */
export function normalizeFeedGameStatus(status: string | null | undefined): FeedGameStatus {
  if (!status) {
    return "scheduled";
  }

  const lower = status.toLowerCase();
  if (FINAL_STATUSES.has(lower)) {
    return "final";
  }

  if (LIVE_STATUSES.has(lower)) {
    return "live";
  }

  return "scheduled";
}

/**
 * If a row is still `live` long after kickoff, treat it as `final`.
 * Applies on read (UI) and during ESPN sync (DB write).
 */
export function applyStaleLiveFinalFallback(
  status: FeedGameStatus,
  startsAt: string | null | undefined,
  now: Date = new Date(),
  staleAfterMs: number = STALE_LIVE_FALLBACK_MS,
): FeedGameStatus {
  if (status !== "live" || !startsAt) {
    return status;
  }

  const kickoffMs = new Date(startsAt).getTime();
  if (!Number.isFinite(kickoffMs)) {
    return status;
  }

  if (now.getTime() > kickoffMs + staleAfterMs) {
    return "final";
  }

  return status;
}

/** Resolve display/selection status from feed row fields — never infers live from kickoff alone. */
export function resolveFeedGameStatus(
  status: string | null | undefined,
  startsAt: string | null | undefined,
  now: Date = new Date(),
): FeedGameStatus {
  return applyStaleLiveFinalFallback(normalizeFeedGameStatus(status), startsAt, now);
}

export function isFeedGameLive(
  status: string | null | undefined,
  startsAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  return resolveFeedGameStatus(status, startsAt, now) === "live";
}

export function isFeedGameFinal(
  status: string | null | undefined,
  startsAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  return resolveFeedGameStatus(status, startsAt, now) === "final";
}
