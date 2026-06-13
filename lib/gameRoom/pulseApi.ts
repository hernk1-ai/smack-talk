import type { GameRoomPulseResponse } from "@/lib/gameRoom/pulse";

export async function fetchGameRoomPulse(
  gameId: string,
  roomCode: string | null,
): Promise<GameRoomPulseResponse | null> {
  const params = new URLSearchParams({ gameId });
  if (roomCode) {
    params.set("roomCode", roomCode);
  }

  const response = await fetch(`/api/game-room/pulse?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json().catch(() => null)) as GameRoomPulseResponse | null;
  if (!payload || !Array.isArray(payload.items)) {
    return null;
  }

  return payload;
}
