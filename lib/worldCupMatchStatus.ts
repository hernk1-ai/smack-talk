import { getWorldCupKickoffIso, type WorldCupMatch } from "@/data/worldCupSchedule";

export type WorldCupMatchLifecycle = "upcoming" | "live" | "finished";

const DEFAULT_MATCH_WINDOW_MINUTES = 180; // 3h — covers extra time + stoppage

export function getWorldCupMatchStatus(
  match: WorldCupMatch,
  now = new Date(),
  matchWindowMinutes = DEFAULT_MATCH_WINDOW_MINUTES,
): WorldCupMatchLifecycle {
  const kickoffIso = getWorldCupKickoffIso(match);
  if (!kickoffIso) {
    return "upcoming";
  }

  const kickoffMs = new Date(kickoffIso).getTime();
  const nowMs = now.getTime();
  const finishedMs = kickoffMs + matchWindowMinutes * 60 * 1000;

  if (nowMs < kickoffMs) return "upcoming";
  if (nowMs <= finishedMs) return "live";
  return "finished";
}

export function getWorldCupMatchRoomGameId(matchId: number) {
  return `wc-2026-${matchId}`;
}
