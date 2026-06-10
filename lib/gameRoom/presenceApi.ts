import { getOrCreateVoterKey } from "@/lib/gameRoom/voterKey";

/**
 * Best available stable identity for presence, without requiring auth:
 * 1. logged-in / guest auth user id (Supabase),
 * 2. otherwise the app's local session key (localStorage voter key).
 */
export function resolveViewerKey(userId?: string | null): string {
  const trimmed = userId?.trim();
  if (trimmed) {
    return trimmed;
  }

  return getOrCreateVoterKey();
}

/**
 * Heartbeat presence for a room scope and return the active viewer count.
 * Returns null on any failure so the caller can simply hide the metric.
 */
export async function heartbeatPresence(
  gameId: string,
  roomCode: string | null,
  viewerKey: string,
): Promise<number | null> {
  if (!gameId || !viewerKey) {
    return null;
  }

  try {
    const response = await fetch("/api/game-room/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, roomCode, viewerKey }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json().catch(() => null)) as { count?: unknown } | null;
    const count = Number(payload?.count);

    return Number.isFinite(count) && count >= 0 ? count : null;
  } catch {
    return null;
  }
}
