import { getWorldCupKickoffIso, type WorldCupMatch } from "@/data/worldCupSchedule";

export type WorldCupMatchLifecycle = "upcoming" | "live" | "finished";

const DEFAULT_MATCH_WINDOW_MINUTES = 180; // 3h — covers extra time + stoppage

/**
 * Display-only lifecycle estimate from kickoff time. Do not use for live/final
 * selection — use resolveFeedGameStatus / resolveWorldCupMatchLifecycle instead.
 */
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

/**
 * Display-only estimated match clock derived purely from kickoff time + `now`.
 * This does NOT change the persisted lifecycle (scheduled/live/finished) — it's a
 * label for the scoreboard status area. Returns null if kickoff is unknown so the
 * caller can fall back to existing status text.
 *
 * Timeline (minutes after kickoff):
 *   < 0      → "UPCOMING"
 *   0–44     → "LIVE · 1'" … "LIVE · 45'"   (first half)
 *   45–59    → "HALFTIME"
 *   60–104   → "LIVE · 46'" … "LIVE · 90'"  (second half)
 *   105–179  → "LIVE"                        (extra time / stoppage, minute unknown)
 *   >= 180   → "FINAL"
 *
 * Note: this is an ESTIMATE. Stoppage time, halftime length, and extra time vary,
 * so the minute can drift from the real match clock.
 */
export function getEstimatedMatchDisplay(match: WorldCupMatch, now = new Date()): string | null {
  const kickoffIso = getWorldCupKickoffIso(match);
  if (!kickoffIso) {
    return null;
  }

  const kickoffMs = new Date(kickoffIso).getTime();
  if (!Number.isFinite(kickoffMs)) {
    return null;
  }

  const elapsedMin = Math.floor((now.getTime() - kickoffMs) / 60000);

  if (elapsedMin < 0) return "UPCOMING";
  if (elapsedMin < 45) return `LIVE · ${elapsedMin + 1}'`;
  if (elapsedMin < 60) return "HALFTIME";
  if (elapsedMin < 105) return `LIVE · ${elapsedMin - 14}'`;
  if (elapsedMin < 180) return "LIVE";
  return "FINAL";
}
