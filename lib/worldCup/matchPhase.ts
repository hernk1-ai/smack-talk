import { isFeedGameFinal, isFeedGameLive, resolveFeedGameStatus } from "@/lib/worldCup/gameStatus";
import { isFinalMatch, isLiveMatch } from "@/lib/worldCup/matchSelection";

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

export function isFinalMatchStatus(status: string | null | undefined): boolean {
  return isFinalMatch(status, null);
}

export function isLiveMatchStatus(status: string | null | undefined): boolean {
  return isLiveMatch(status, null);
}

/**
 * Resolve the current match phase for video selection and room copy.
 * Uses feed status only — does not infer live from kickoff time.
 */
export function resolveWorldCupMatchPhase({
  status,
  startsAt,
  now = new Date(),
}: {
  status?: string | null;
  startsAt?: string | null;
  now?: Date;
}): WorldCupMatchPhase {
  const resolved = resolveFeedGameStatus(status, startsAt, now);

  if (resolved === "final") {
    return "post_match";
  }

  if (resolved === "live") {
    return "live";
  }

  const startsAtMs = startsAt ? new Date(startsAt).getTime() : Number.NaN;
  if (Number.isFinite(startsAtMs) && now.getTime() < startsAtMs) {
    return "pre_match";
  }

  return "pre_match";
}
