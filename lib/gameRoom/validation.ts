import { isValidRoomCode } from "@/lib/gameRoom/roomCode";
import type { RootingSide } from "@/lib/gameRoom/rooting";

export function validateGameId(value: unknown) {
  if (typeof value !== "string") {
    return { valid: false as const, error: "gameId is required." };
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 120) {
    return { valid: false as const, error: "Invalid gameId." };
  }

  return { valid: true as const, value: trimmed };
}

export function validateRoomCode(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return { valid: true as const, value: null as string | null };
  }

  if (typeof value !== "string" || !isValidRoomCode(value.trim())) {
    return { valid: false as const, error: "Invalid room code." };
  }

  return { valid: true as const, value: value.trim() };
}

export function validateVoterKey(value: unknown) {
  if (typeof value !== "string") {
    return { valid: false as const, error: "voterKey is required." };
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 80 || !/^[a-zA-Z0-9-]+$/.test(trimmed)) {
    return { valid: false as const, error: "Invalid voterKey." };
  }

  return { valid: true as const, value: trimmed };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateMessageId(value: unknown) {
  if (typeof value !== "string") {
    return { valid: false as const, error: "messageId is required." };
  }

  const trimmed = value.trim();
  if (!UUID_RE.test(trimmed)) {
    return { valid: false as const, error: "Invalid message id." };
  }

  return { valid: true as const, value: trimmed };
}

export function validateTeamKey(value: unknown): { valid: true; value: RootingSide } | { valid: false; error: string } {
  if (value === "home" || value === "away") {
    return { valid: true, value };
  }

  return { valid: false, error: "teamKey must be home or away." };
}
