import { NextResponse } from "next/server";

import { heartbeatPresence } from "@/lib/gameRoom/presenceServer";
import { validateGameId, validateRoomCode, validateVoterKey } from "@/lib/gameRoom/validation";
import { enforceRateLimit, jsonError } from "@/lib/security/api";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const rateLimited = enforceRateLimit({
    request,
    action: "game-room-presence",
    limit: 40,
    windowMs: 60 * 1000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  const body = (await request.json().catch(() => null)) as
    | {
        gameId?: unknown;
        roomCode?: unknown;
        viewerKey?: unknown;
      }
    | null;

  const gameIdCheck = validateGameId(body?.gameId);
  const roomCodeCheck = validateRoomCode(body?.roomCode ?? null);
  const viewerKeyCheck = validateVoterKey(body?.viewerKey);

  if (!gameIdCheck.valid) {
    return jsonError(gameIdCheck.error);
  }

  if (!roomCodeCheck.valid) {
    return jsonError(roomCodeCheck.error);
  }

  if (!viewerKeyCheck.valid) {
    return jsonError(viewerKeyCheck.error);
  }

  const admin = createAdminClient();
  if (!admin) {
    return jsonError("Supabase is not configured.", 503);
  }

  const { error, count } = await heartbeatPresence(admin, {
    gameId: gameIdCheck.value,
    roomCode: roomCodeCheck.value,
    viewerKey: viewerKeyCheck.value,
  });

  if (error) {
    return jsonError("Unable to update presence.", 500);
  }

  return NextResponse.json({ count });
}
