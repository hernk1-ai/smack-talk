import { COMMENT_TEXT_MAX } from "@/lib/security/constants";
import { containsBlockedTerms } from "@/lib/security/contentPolicy";

export const CHAT_EDIT_WINDOW_MS = 5 * 60 * 1000;

export function isWithinChatEditWindow(createdAt: string, now = Date.now()) {
  const createdMs = new Date(createdAt).getTime();
  if (!Number.isFinite(createdMs)) {
    return false;
  }

  return now - createdMs <= CHAT_EDIT_WINDOW_MS;
}

export function canEditChatMessageLocally(
  message: { senderKey: string; createdAt: string },
  senderKey: string,
  now = Date.now(),
) {
  return Boolean(senderKey) && message.senderKey === senderKey && isWithinChatEditWindow(message.createdAt, now);
}

export function validateRoomChatMessage(value: string) {
  const cleaned = value.trim();

  if (!cleaned) {
    return { valid: false as const, error: "Write a message before sending." };
  }

  if (cleaned.length > COMMENT_TEXT_MAX) {
    return { valid: false as const, error: `Keep messages under ${COMMENT_TEXT_MAX} characters.` };
  }

  if (containsBlockedTerms(cleaned)) {
    return { valid: false as const, error: "Please keep messages family-friendly." };
  }

  return { valid: true as const, value: cleaned };
}

type EditCheck = { name: string; pass: boolean; detail: string };

/** Dev-safe checks for chat edit window and local ownership hints. */
export function validateChatMessageEditRules(): { ok: boolean; checks: EditCheck[] } {
  const checks: EditCheck[] = [];
  const createdAt = "2026-06-12T12:00:00.000Z";
  const senderKey = "abc-123";

  checks.push({
    name: "own message within 5 minutes",
    pass: canEditChatMessageLocally({ senderKey, createdAt }, senderKey, new Date("2026-06-12T12:04:00.000Z").getTime()),
    detail: "editable",
  });

  checks.push({
    name: "cannot edit someone else's message",
    pass: !canEditChatMessageLocally({ senderKey, createdAt }, "other-key", new Date("2026-06-12T12:04:00.000Z").getTime()),
    detail: "blocked",
  });

  checks.push({
    name: "cannot edit after 5 minutes",
    pass: !isWithinChatEditWindow(createdAt, new Date("2026-06-12T12:06:00.000Z").getTime()),
    detail: "expired",
  });

  const empty = validateRoomChatMessage("   ");
  checks.push({
    name: "empty message cannot be saved",
    pass: !empty.valid,
    detail: empty.valid ? "allowed" : empty.error,
  });

  return { ok: checks.every((check) => check.pass), checks };
}
