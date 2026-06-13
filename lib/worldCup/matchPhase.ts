/** Current match phase for World Cup TV targeting and room copy. */
export type WorldCupMatchPhase = "pre_match" | "live" | "post_match";

/** Video targeting phase — includes `any` for phase-agnostic videos. */
export type WorldCupVideoMatchPhase = WorldCupMatchPhase | "any";

export const WORLD_CUP_VIDEO_MATCH_PHASES = [
  "any",
  "pre_match",
  "live",
  "post_match",
] as const;

export const WORLD_CUP_VIDEO_PHASE_OPTIONS = [
  { value: "any", label: "Any time" },
  { value: "pre_match", label: "Before match" },
  { value: "live", label: "During match" },
  { value: "post_match", label: "After match" },
] as const;

export const WORLD_CUP_VIDEO_PHASE_LABELS: Record<WorldCupVideoMatchPhase, string> = {
  any: "Any time",
  pre_match: "Before match",
  live: "During match",
  post_match: "After match",
};

export const WORLD_CUP_TV_SUBTITLES: Record<WorldCupMatchPhase | "any", string> = {
  pre_match: "Preview coverage before kickoff.",
  live: "Coverage and context while the match is live.",
  post_match: "Highlights and reaction after the final whistle.",
  any: "Preview, highlights, and fan videos for this match.",
};

const FINAL_STATUSES = new Set(["final", "complete", "full_time", "finished"]);
const LIVE_STATUSES = new Set(["live", "in_progress", "first_half", "second_half", "halftime"]);

/** Fallback live window when DB status lags behind kickoff (2.5 hours). */
export const MATCH_PHASE_LIVE_WINDOW_MS = 2.5 * 60 * 60 * 1000;

export function isFinalMatchStatus(status: string | null | undefined): boolean {
  return Boolean(status && FINAL_STATUSES.has(status.toLowerCase()));
}

export function isLiveMatchStatus(status: string | null | undefined): boolean {
  return Boolean(status && LIVE_STATUSES.has(status.toLowerCase()));
}

/**
 * Resolve the current match phase for video selection and room copy.
 * Centralized so Match Hub and Game Room can share the same rules.
 */
export function resolveWorldCupMatchPhase({
  status,
  startsAt,
  now = new Date(),
  liveWindowMs = MATCH_PHASE_LIVE_WINDOW_MS,
}: {
  status?: string | null;
  startsAt?: string | null;
  now?: Date;
  liveWindowMs?: number;
}): WorldCupMatchPhase {
  if (isFinalMatchStatus(status)) {
    return "post_match";
  }

  if (isLiveMatchStatus(status)) {
    return "live";
  }

  const startsAtMs = startsAt ? new Date(startsAt).getTime() : Number.NaN;
  const nowMs = now.getTime();

  if (Number.isFinite(startsAtMs)) {
    if (nowMs < startsAtMs) {
      return "pre_match";
    }

    if (nowMs <= startsAtMs + liveWindowMs) {
      return "live";
    }

    return "post_match";
  }

  return "pre_match";
}
