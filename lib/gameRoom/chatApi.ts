import type { MatchRoomMessage } from "@/lib/gameRoom/chatServer";
import { getOrAssignSoccerNickname } from "@/lib/gameRoom/soccerNickname";
import { getOrCreateVoterKey } from "@/lib/gameRoom/voterKey";

const DISPLAY_NAME_STORAGE = "lockt-room-chat-display-name";

export function getChatDisplayName() {
  if (typeof window === "undefined") {
    return "Guest";
  }

  const stored = window.localStorage.getItem(DISPLAY_NAME_STORAGE)?.trim();
  if (stored && !/^fan-/i.test(stored)) {
    return stored.slice(0, 20);
  }

  if (stored && /^fan-/i.test(stored)) {
    window.localStorage.removeItem(DISPLAY_NAME_STORAGE);
  }

  return getOrAssignSoccerNickname();
}

export function setChatDisplayName(name: string) {
  if (typeof window === "undefined") {
    return;
  }

  const trimmed = name.trim().slice(0, 20);
  if (trimmed) {
    window.localStorage.setItem(DISPLAY_NAME_STORAGE, trimmed);
  }
}

function buildChatQuery(gameId: string, roomCode: string | null) {
  const params = new URLSearchParams({ gameId });
  if (roomCode) {
    params.set("roomCode", roomCode);
  }
  return params.toString();
}

export async function fetchRoomChatMessages(gameId: string, roomCode: string | null) {
  const response = await fetch(`/api/game-room/chat?${buildChatQuery(gameId, roomCode)}`, {
    method: "GET",
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | { messages?: MatchRoomMessage[]; error?: string }
    | null;

  if (!response.ok) {
    return {
      messages: [] as MatchRoomMessage[],
      error: payload?.error ?? "Unable to load room chat.",
    };
  }

  return {
    messages: payload?.messages ?? [],
    error: null,
  };
}

export async function sendRoomChatMessage(gameId: string, roomCode: string | null, messageText: string) {
  const senderKey = getOrCreateVoterKey();
  if (!senderKey) {
    return { message: null as MatchRoomMessage | null, error: "Unable to send message." };
  }

  const response = await fetch("/api/game-room/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      gameId,
      roomCode: roomCode ?? undefined,
      senderKey,
      displayName: getChatDisplayName(),
      messageText,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { message?: MatchRoomMessage; error?: string }
    | null;

  if (!response.ok || !payload?.message) {
    return {
      message: null,
      error: payload?.error ?? "Unable to send message.",
    };
  }

  return { message: payload.message, error: null };
}

export async function editRoomChatMessage(messageId: string, newBody: string) {
  const senderKey = getOrCreateVoterKey();
  if (!senderKey) {
    return { message: null as MatchRoomMessage | null, error: "Unable to edit message." };
  }

  const response = await fetch("/api/game-room/chat/message", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messageId,
      newBody,
      senderKey,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { message?: MatchRoomMessage; error?: string }
    | null;

  if (!response.ok || !payload?.message) {
    return {
      message: null,
      error: payload?.error ?? "Unable to edit message.",
    };
  }

  return { message: payload.message, error: null };
}

export type { MatchRoomMessage };
