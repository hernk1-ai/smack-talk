import { NextResponse } from "next/server";

import { loadRootingState, upsertRootingVote, getPrivateRoom } from "@/lib/gameRoom/rootingServer";
import { validateGameId, validateRoomCode, validateTeamKey, validateVoterKey } from "@/lib/gameRoom/validation";
import { enforceRateLimit, jsonError } from "@/lib/security/api";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const gameIdCheck = validateGameId(url.searchParams.get("gameId"));
  const roomCodeCheck = validateRoomCode(url.searchParams.get("roomCode"));
  const voterKeyParam = url.searchParams.get("voterKey");
  const voterKeyCheck = voterKeyParam ? validateVoterKey(voterKeyParam) : { valid: true as const, value: null as string | null };

  if (!gameIdCheck.valid) {
    return jsonError(gameIdCheck.error);
  }

  if (!roomCodeCheck.valid) {
    return jsonError(roomCodeCheck.error);
  }

  if (!voterKeyCheck.valid) {
    return jsonError(voterKeyCheck.error);
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

  const { error, state } = await loadRootingState(
    admin,
    gameIdCheck.value,
    roomCodeCheck.value,
    voterKeyCheck.value,
  );

  if (error || !state) {
    return jsonError(error ?? "Unable to load rooting.", 500);
  }

  return NextResponse.json(state);
}

export async function POST(request: Request) {
  const rateLimited = enforceRateLimit({
    request,
    action: "game-room-rooting-vote",
    limit: 60,
    windowMs: 60 * 1000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  const body = (await request.json().catch(() => null)) as
    | {
        gameId?: unknown;
        roomCode?: unknown;
        voterKey?: unknown;
        teamKey?: unknown;
      }
    | null;

  const gameIdCheck = validateGameId(body?.gameId);
  const roomCodeCheck = validateRoomCode(body?.roomCode ?? null);
  const voterKeyCheck = validateVoterKey(body?.voterKey);
  const teamKeyCheck = validateTeamKey(body?.teamKey);

  if (!gameIdCheck.valid) {
    return jsonError(gameIdCheck.error);
  }

  if (!roomCodeCheck.valid) {
    return jsonError(roomCodeCheck.error);
  }

  if (!voterKeyCheck.valid) {
    return jsonError(voterKeyCheck.error);
  }

  if (!teamKeyCheck.valid) {
    return jsonError(teamKeyCheck.error);
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

  const { error, state } = await upsertRootingVote(admin, {
    gameId: gameIdCheck.value,
    roomCode: roomCodeCheck.value,
    voterKey: voterKeyCheck.value,
    teamKey: teamKeyCheck.value,
  });

  if (error || !state) {
    return jsonError(error ?? "Unable to save vote.", 500);
  }

  return NextResponse.json(state);
}
