const INTERNAL_ERROR_PATTERNS = [
  /violates foreign key constraint/i,
  /duplicate key value/i,
  /constraint/i,
  /postgres/i,
  /supabase/i,
  /sql/i,
  /stack/i,
];

export function getUserFacingErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== "object") {
    return fallback;
  }

  const message = "message" in error && typeof (error as { message?: unknown }).message === "string"
    ? (error as { message: string }).message
    : "";

  if (!message) {
    return fallback;
  }

  if (INTERNAL_ERROR_PATTERNS.some((pattern) => pattern.test(message))) {
    return fallback;
  }

  return message;
}
