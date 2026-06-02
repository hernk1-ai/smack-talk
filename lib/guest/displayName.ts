const BLOCKED_TERMS = ["fuck", "shit", "bitch", "asshole", "nigger", "faggot", "cunt"];

export const GUEST_DISPLAY_NAME_MAX = 20;
export const GUEST_DISPLAY_NAME_MIN = 2;
export const GUEST_COMMENT_MAX = 160;

export function sanitizeGuestDisplayName(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, GUEST_DISPLAY_NAME_MAX);
}

export function validateGuestDisplayName(value: string) {
  const cleaned = sanitizeGuestDisplayName(value);

  if (!cleaned) {
    return { valid: false as const, cleaned, error: "Choose a Game Room name." };
  }

  if (cleaned.length < GUEST_DISPLAY_NAME_MIN) {
    return { valid: false as const, cleaned, error: "Name must be at least 2 characters." };
  }

  const normalized = cleaned.toLowerCase();
  if (BLOCKED_TERMS.some((term) => normalized.includes(term))) {
    return { valid: false as const, cleaned, error: "Please choose a different name." };
  }

  return { valid: true as const, cleaned, error: null };
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
