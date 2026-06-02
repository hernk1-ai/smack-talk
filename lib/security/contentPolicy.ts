import {
  CALL_TEXT_MAX,
  COMMENT_TEXT_MAX,
  DISPLAY_NAME_MAX,
  DISPLAY_NAME_MIN,
} from "@/lib/security/constants";

const BLOCKED_TERMS = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "cunt",
  "nigger",
  "faggot",
  "retard",
  "whore",
];

export type ValidationResult =
  | { valid: true; value: string }
  | { valid: false; error: string };

export function containsBlockedTerms(value: string) {
  const normalized = value.trim().toLowerCase();
  return BLOCKED_TERMS.some((term) => normalized.includes(term));
}

export function validateRequiredId(value: unknown, label: string): ValidationResult {
  if (typeof value !== "string" || !value.trim()) {
    return { valid: false, error: `${label} is required.` };
  }

  return { valid: true, value: value.trim() };
}

export function validateCallText(value: unknown): ValidationResult {
  if (typeof value !== "string") {
    return { valid: false, error: "Call text is required." };
  }

  const cleaned = value.trim();

  if (!cleaned) {
    return { valid: false, error: "Write your call before saving." };
  }

  if (cleaned.length > CALL_TEXT_MAX) {
    return { valid: false, error: `Keep calls under ${CALL_TEXT_MAX} characters.` };
  }

  if (containsBlockedTerms(cleaned)) {
    return { valid: false, error: "Please keep calls family-friendly." };
  }

  return { valid: true, value: cleaned };
}

export function validateCommentText(value: unknown): ValidationResult {
  if (typeof value !== "string") {
    return { valid: false, error: "Comment text is required." };
  }

  const cleaned = value.trim();

  if (!cleaned) {
    return { valid: false, error: "Say something before you comment." };
  }

  if (cleaned.length > COMMENT_TEXT_MAX) {
    return { valid: false, error: `Keep comments under ${COMMENT_TEXT_MAX} characters.` };
  }

  if (containsBlockedTerms(cleaned)) {
    return { valid: false, error: "Please keep comments family-friendly." };
  }

  return { valid: true, value: cleaned };
}

export function validateDisplayName(value: unknown): ValidationResult {
  if (typeof value !== "string") {
    return { valid: false, error: "Choose a Game Room name." };
  }

  const cleaned = value.trim().replace(/\s+/g, " ").slice(0, DISPLAY_NAME_MAX);

  if (!cleaned) {
    return { valid: false, error: "Choose a Game Room name." };
  }

  if (cleaned.length < DISPLAY_NAME_MIN) {
    return { valid: false, error: `Name must be at least ${DISPLAY_NAME_MIN} characters.` };
  }

  if (containsBlockedTerms(cleaned)) {
    return { valid: false, error: "Please choose a different name." };
  }

  return { valid: true, value: cleaned };
}
