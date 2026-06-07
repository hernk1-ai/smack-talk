import { NextResponse } from "next/server";

import { createMatchRoomMessage, listMatchRoomMessages } from "@/lib/gameRoom/chatServer";
import { getPrivateRoom } from "@/lib/gameRoom/rootingServer";
import { validateGameId, validateRoomCode, validateVoterKey } from "@/lib/gameRoom/validation";
import { validateRoomChatMessage } from "@/lib/gameRoom/chatValidation";
import { enforceRateLimit, jsonError } from "@/lib/security/api";
import { validateDisplayName } from "@/lib/security/contentPolicy";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseAdminSetupError } from "@/lib/supabase/env";

function getAdminOrError() {
  const setupError = getSupabaseAdminSetupError();
  if (setupError) {
    return { admin: null, error: jsonError("Supabase is not configured.", 503) };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { admin: null, error: jsonError("Supabase is not configured.", 503) };
  }

  return { admin, error: null };
}

async function ensurePrivateRoom(admin: NonNullable<ReturnType<typeof createAdminClient>>, gameId: string, roomCode: string) {
  const { error, room } = await getPrivateRoom(admin, gameId, roomCode);

  if (error) {
    return jsonError("Unable to load private room.", 500);
  }

  if (!room) {
    return jsonError("Private room not found.", 404);
  }

  return null;
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

  const { admin, error: adminError } = getAdminOrError();
  if (adminError || !admin) {
    return adminError ?? jsonError("Supabase is not configured.", 503);
  }

  const roomError = await ensurePrivateRoom(admin, gameIdCheck.value, roomCodeCheck.value);
  if (roomError) {
    return roomError;
  }

  const { error, messages } = await listMatchRoomMessages(admin, gameIdCheck.value, roomCodeCheck.value);

  if (error || !messages) {
    return jsonError(error ?? "Unable to load room chat.", 500);
  }

  return NextResponse.json({ messages, count: messages.length });
}

export async function POST(request: Request) {
  const rateLimited = enforceRateLimit({
    request,
    action: "game-room-chat-send",
    limit: 30,
    windowMs: 60_000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  const body = (await request.json().catch(() => null)) as
    | {
        gameId?: unknown;
        roomCode?: unknown;
        senderKey?: unknown;
        displayName?: unknown;
        messageText?: unknown;
      }
    | null;

  const gameIdCheck = validateGameId(body?.gameId);
  const roomCodeCheck = validateRoomCode(body?.roomCode);
  const senderKeyCheck = validateVoterKey(body?.senderKey);
  const messageCheck = validateRoomChatMessage(typeof body?.messageText === "string" ? body.messageText : "");

  if (!gameIdCheck.valid) {
    return jsonError(gameIdCheck.error);
  }

  if (!roomCodeCheck.valid) {
    return jsonError(roomCodeCheck.error);
  }

  if (!roomCodeCheck.value) {
    return jsonError("roomCode is required.");
  }

  if (!senderKeyCheck.valid) {
    return jsonError(senderKeyCheck.error);
  }

  if (!messageCheck.valid) {
    return jsonError(messageCheck.error);
  }

  let displayName: string | null = null;
  if (typeof body?.displayName === "string" && body.displayName.trim()) {
    const nameCheck = validateDisplayName(body.displayName);
    if (!nameCheck.valid) {
      return jsonError(nameCheck.error);
    }
    displayName = nameCheck.value;
  }

  const { admin, error: adminError } = getAdminOrError();
  if (adminError || !admin) {
    return adminError ?? jsonError("Supabase is not configured.", 503);
  }

  const roomError = await ensurePrivateRoom(admin, gameIdCheck.value, roomCodeCheck.value);
  if (roomError) {
    return roomError;
  }

  const { error, message } = await createMatchRoomMessage(admin, {
    gameId: gameIdCheck.value,
    roomCode: roomCodeCheck.value,
    senderKey: senderKeyCheck.value,
    displayName,
    messageText: messageCheck.value,
  });

  if (error || !message) {
    return jsonError(error ?? "Unable to send message.", 500);
  }

  return NextResponse.json({ message });
}
