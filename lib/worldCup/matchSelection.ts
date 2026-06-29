import { getWorldCupKickoffIso, type WorldCupMatch } from "@/data/worldCupSchedule";
import { getKickoffMs } from "@/lib/worldCup/localSchedule";
import {
  isFeedGameFinal,
  isFeedGameLive,
  normalizeFeedGameStatus,
  resolveFeedGameStatus,
} from "@/lib/worldCup/gameStatus";
import type { ScheduleMatchState, ScheduleMatchStatus } from "@/lib/worldCup/scheduleStatus";
import type { WorldCupGameSnapshot } from "@/lib/worldCupMatchResolver";

/** Soccer match window — after this, stop treating a match as upcoming/current without provider final. */
export const MATCH_POST_KICKOFF_WINDOW_MS = 3 * 60 * 60 * 1000;

export type MatchFeedFields = {
  status?: string | null;
  startsAt?: string | null;
  clock?: string | null;
  period?: string | null;
  eventName?: string | null;
};

/** Provider-confirmed final (never inferred from kickoff alone). */
export function isFinalMatch(
  status: string | null | undefined,
  startsAt?: string | null,
  now: Date = new Date(),
): boolean {
  return isFeedGameFinal(status, startsAt, now);
}

/** Actively live per feed status (includes stale-live finalization). */
export function isLiveMatch(
  status: string | null | undefined,
  startsAt?: string | null,
  now: Date = new Date(),
  feed?: Pick<MatchFeedFields, "clock" | "period" | "eventName"> | null,
): boolean {
  if (isFeedGameLive(status, startsAt, now)) {
    return true;
  }

  // ESPN can keep status=live with a stale starts_at while clock/period remain active.
  if (normalizeFeedGameStatus(status) === "live") {
    return Boolean(feed?.clock?.trim() || feed?.period?.trim() || feed?.eventName?.trim());
  }

  return false;
}

/**
 * Selectable upcoming match: provider says scheduled/upcoming and kickoff is still in the future.
 * Past-kickoff rows are never upcoming for hub/nav selection.
 */
export function isUpcomingMatch(
  status: string | null | undefined,
  startsAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (isFinalMatch(status, startsAt, now) || isLiveMatch(status, startsAt, now)) {
    return false;
  }

  const kickoffMs = startsAt ? new Date(startsAt).getTime() : Number.NaN;
  if (!Number.isFinite(kickoffMs)) {
    return normalizeFeedGameStatus(status) === "scheduled";
  }

  return now.getTime() < kickoffMs;
}

/** Past kickoff without provider live/final — excluded from current/next selection. */
export function isAwaitingResultMatch(
  status: string | null | undefined,
  startsAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (isFinalMatch(status, startsAt, now) || isLiveMatch(status, startsAt, now)) {
    return false;
  }

  const kickoffMs = startsAt ? new Date(startsAt).getTime() : Number.NaN;
  return Number.isFinite(kickoffMs) && now.getTime() >= kickoffMs;
}

export function resolveMatchFeedStatus(
  status: string | null | undefined,
  startsAt: string | null | undefined,
  now: Date = new Date(),
): "final" | "live" | "upcoming" | "awaiting_result" {
  if (isFinalMatch(status, startsAt, now)) {
    return "final";
  }

  if (isLiveMatch(status, startsAt, now)) {
    return "live";
  }

  if (isUpcomingMatch(status, startsAt, now)) {
    return "upcoming";
  }

  if (isAwaitingResultMatch(status, startsAt, now)) {
    return "awaiting_result";
  }

  return "upcoming";
}

export function scheduleStatusFromFeed(
  status: string | null | undefined,
  startsAt: string | null | undefined,
  now: Date = new Date(),
  feed?: Pick<MatchFeedFields, "clock" | "period" | "eventName"> | null,
): ScheduleMatchStatus {
  if (isFinalMatch(status, startsAt, now)) {
    return "final";
  }

  if (isLiveMatch(status, startsAt, now, feed)) {
    return "live";
  }

  if (isUpcomingMatch(status, startsAt, now)) {
    return "upcoming";
  }

  if (isAwaitingResultMatch(status, startsAt, now)) {
    return "awaiting_result";
  }

  return "upcoming";
}

export function isSelectableScheduleState(
  state: ScheduleMatchState,
  match: WorldCupMatch,
  now: Date = new Date(),
): boolean {
  if (state.status === "live") {
    return true;
  }

  if (state.status !== "upcoming") {
    return false;
  }

  return getKickoffMs(match) > now.getTime();
}

export function gameSnapshotToFeedFields(game: WorldCupGameSnapshot | null | undefined): MatchFeedFields | null {
  if (!game) {
    return null;
  }

  return {
    status: game.status,
    startsAt: game.starts_at,
    clock: game.clock,
    period: game.period,
    eventName: game.event_name,
  };
}

export function getCountdownLabel(
  match: WorldCupMatch,
  now: Date = new Date(),
  feed?: MatchFeedFields | null,
): string {
  const kickoffIso = feed?.startsAt ?? getWorldCupKickoffIso(match);
  if (!kickoffIso) {
    return "—";
  }

  const startsAt = kickoffIso;
  if (isFinalMatch(feed?.status, startsAt, now)) {
    return "Final";
  }

  const diff = new Date(kickoffIso).getTime() - now.getTime();
  if (diff <= 0) {
    if (isLiveMatch(feed?.status, startsAt, now, feed)) {
      return "0d 00h 00m 00s";
    }

    return "Awaiting result";
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

/** Never downgrade a persisted final row when applying ESPN patches. */
export function shouldApplyEspnStatusPatch(
  currentStatus: string | null | undefined,
  nextStatus: "scheduled" | "live" | "final" | null | undefined,
): nextStatus is "scheduled" | "live" | "final" {
  if (!nextStatus) {
    return false;
  }

  if (normalizeFeedGameStatus(currentStatus) === "final" && nextStatus !== "final") {
    return false;
  }

  return true;
}

/** Only apply ESPN scores when the event is final or the game is not yet final. */
export function shouldApplyEspnScorePatch(
  currentStatus: string | null | undefined,
  eventStatus: "scheduled" | "live" | "final" | null,
  hasEspnScores: boolean,
): boolean {
  if (!hasEspnScores) {
    return false;
  }

  if (normalizeFeedGameStatus(currentStatus) === "final") {
    return eventStatus === "final";
  }

  return true;
}
