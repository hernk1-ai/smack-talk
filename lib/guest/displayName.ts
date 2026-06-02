import {
  CALL_TEXT_MAX,
  COMMENT_TEXT_MAX,
  DISPLAY_NAME_MAX,
  DISPLAY_NAME_MIN,
} from "@/lib/security/constants";
import { validateDisplayName } from "@/lib/security/contentPolicy";

export const GUEST_DISPLAY_NAME_MAX = DISPLAY_NAME_MAX;
export const GUEST_DISPLAY_NAME_MIN = DISPLAY_NAME_MIN;
/** Match calls (takes) in the Game Room feed. */
export const GUEST_CALL_TEXT_MAX = CALL_TEXT_MAX;
/** Thread comments / replies. */
export const GUEST_COMMENT_MAX = COMMENT_TEXT_MAX;

export function sanitizeGuestDisplayName(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, GUEST_DISPLAY_NAME_MAX);
}

export function validateGuestDisplayName(value: string) {
  const result = validateDisplayName(value);

  if (!result.valid) {
    return { valid: false as const, cleaned: sanitizeGuestDisplayName(value), error: result.error };
  }

  return { valid: true as const, cleaned: result.value, error: null };
}

export function guestDisplayNameToUsernameSlug(displayName: string) {
  let slug = displayName
    .replace(/[^a-zA-Z0-9_]/g, "")
    .replace(/^_+|_+$/g, "")
    .slice(0, 16);

  if (slug.length < 3) {
    slug = `Guest${slug}`.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
  }

  return slug || "GuestFan";
}
