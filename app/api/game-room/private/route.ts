import { NextResponse } from "next/server";

import { buildPrivateRoomPath, generateRoomCode } from "@/lib/gameRoom/roomCode";
import { createPrivateRoom, getPrivateRoom } from "@/lib/gameRoom/rootingServer";
import { validateGameId, validateRoomCode } from "@/lib/gameRoom/validation";
import { enforceRateLimit, jsonError } from "@/lib/security/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseAdminSetupError } from "@/lib/supabase/env";
import { buildSiteUrl } from "@/lib/site-url";

function isDevelopment() {
  return process.env.NODE_ENV === "development";
}

function formatInsertErrorDetail({
  gameId,
  roomCode,
  message,
  code,
  details,
  hint,
}: {
  gameId: string;
  roomCode: string;
  message: string;
  code?: string | null;
  details?: string | null;
  hint?: string | null;
}) {
  const parts = [
    `Supabase insert into private_match_rooms failed.`,
    `game_id=${gameId}`,
    `room_code=${roomCode}`,
    `message=${message}`,
  ];

  if (code) {
    parts.push(`code=${code}`);
  }

  if (details) {
    parts.push(`details=${details}`);
  }

  if (hint) {
    parts.push(`hint=${hint}`);
  }

  return parts.join(" ");
}

function respondPrivateRoomError(genericMessage: string, status: number, devDetail?: string) {
  if (devDetail) {
    console.error("[POST /api/game-room/private]", devDetail);
  }

  const message = isDevelopment() && devDetail ? devDetail : genericMessage;
  return jsonError(message, status);
}

function isDuplicateRoomCodeError(message: string, code?: string | null) {
  const normalized = message.toLowerCase();
  return code === "23505" || normalized.includes("duplicate") || normalized.includes("unique");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const gameIdCheck = validateGameId(url.searchParams.get("gameId"));
  const roomCodeCheck = validateRoomCode(url.searchParams.get("roomCode"));

  if (!gameIdCheck.valid) {
    return jsonError(gameIdCheck.error);
  }

  if (!roomCodeCheck.valid) {
    return jsonError(roomCodeCheck.error);
  }

  if (!roomCodeCheck.value) {
    return jsonError("roomCode is required.");
  }

  const setupError = getSupabaseAdminSetupError();
  if (setupError) {
    return respondPrivateRoomError("Supabase is not configured.", 503, setupError);
  }

  const admin = createAdminClient();
  if (!admin) {
    return respondPrivateRoomError(
      "Supabase is not configured.",
      503,
      "Admin client unavailable. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const { error, room } = await getPrivateRoom(admin, gameIdCheck.value, roomCodeCheck.value);

  if (error) {
    return respondPrivateRoomError("Unable to load private room.", 500, error);
  }

  if (!room) {
    return jsonError("Private room not found.", 404);
  }

  return NextResponse.json({
    gameId: room.game_id,
    roomCode: room.room_code,
    invitePath: buildPrivateRoomPath(room.game_id, room.room_code),
  });
}

export async function POST(request: Request) {
  const rateLimited = enforceRateLimit({
    request,
    action: "game-room-private-create",
    limit: 12,
    windowMs: 60 * 60 * 1000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  const body = (await request.json().catch(() => null)) as { gameId?: unknown } | null;
  const gameIdCheck = validateGameId(body?.gameId);

  if (!gameIdCheck.valid) {
    return jsonError(gameIdCheck.error);
  }

  const setupError = getSupabaseAdminSetupError();
  if (setupError) {
    return respondPrivateRoomError("Supabase is not configured.", 503, setupError);
  }

  const admin = createAdminClient();
  if (!admin) {
    return respondPrivateRoomError(
      "Supabase is not configured.",
      503,
      "Admin client unavailable. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  let lastInsertError: string | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const roomCode = generateRoomCode();
    const {
      error,
      errorCode,
      errorDetails,
      errorHint,
      roomCode: createdCode,
    } = await createPrivateRoom(admin, gameIdCheck.value, roomCode);

    if (!error && createdCode) {
      const invitePath = buildPrivateRoomPath(gameIdCheck.value, createdCode);
      return NextResponse.json({
        roomCode: createdCode,
        invitePath,
        inviteUrl: buildSiteUrl(invitePath),
      });
    }

    if (!error) {
      lastInsertError = "Insert succeeded but no room_code was returned.";
      console.error("[POST /api/game-room/private]", lastInsertError, { gameId: gameIdCheck.value, roomCode });
      break;
    }

    const detail = formatInsertErrorDetail({
      gameId: gameIdCheck.value,
      roomCode,
      message: error,
      code: errorCode,
      details: errorDetails,
      hint: errorHint,
    });

    console.error("[POST /api/game-room/private]", detail);
    lastInsertError = detail;

    if (!isDuplicateRoomCodeError(error, errorCode)) {
      return respondPrivateRoomError("Unable to create private room.", 500, detail);
    }
  }

  return respondPrivateRoomError(
    "Unable to create private room.",
    500,
    lastInsertError ?? "Unable to create private room after multiple attempts.",
  );
}
