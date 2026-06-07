import { COMMENT_TEXT_MAX } from "@/lib/security/constants";
import { containsBlockedTerms } from "@/lib/security/contentPolicy";

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
