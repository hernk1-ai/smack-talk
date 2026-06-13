import { NextResponse } from "next/server";

import { loadGameRoomPulse } from "@/lib/gameRoom/pulseServer";
import { getPrivateRoom } from "@/lib/gameRoom/rootingServer";
import { validateGameId, validateRoomCode } from "@/lib/gameRoom/validation";
import { enforceRateLimit, jsonError } from "@/lib/security/api";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit({
    request,
    action: "game-room-pulse",
    limit: 120,
    windowMs: 60 * 1000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  const url = new URL(request.url);
  const gameIdCheck = validateGameId(url.searchParams.get("gameId"));
  const roomCodeCheck = validateRoomCode(url.searchParams.get("roomCode"));

  if (!gameIdCheck.valid) {
    return jsonError(gameIdCheck.error);
  }

  if (!roomCodeCheck.valid) {
    return jsonError(roomCodeCheck.error);
  }

  const admin = createAdminClient();
  if (!admin) {
    return jsonError("Supabase is not configured.", 503);
  }

  if (roomCodeCheck.value) {
    const { error: roomError, room } = await getPrivateRoom(admin, gameIdCheck.value, roomCodeCheck.value);
    if (roomError) {
      return jsonError("Unable to load private room.", 500);
    }
    if (!room) {
      return jsonError("Private room not found.", 404);
    }
  }

  const { error, pulse } = await loadGameRoomPulse(admin, {
    gameId: gameIdCheck.value,
    roomCode: roomCodeCheck.value,
  });

  if (error || !pulse) {
    return jsonError(error ?? "Unable to load pulse.", 500);
  }

  return NextResponse.json(pulse);
}
