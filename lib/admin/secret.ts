import { timingSafeEqual } from "node:crypto";

import { adminSecret, cronSecret, isAdminConfigured, isCronConfigured } from "@/lib/supabase/env";

export const ADMIN_SECRET_HEADER = "x-admin-secret";

/** Whether a usable ADMIN_SECRET is configured. */
export function isAdminSecretConfigured(): boolean {
  return isAdminConfigured;
}

/** Constant-time, fail-closed comparison against a configured secret. */
function matchesSecret(expected: string | undefined, provided: string | null | undefined): boolean {
  if (!expected || expected.trim().length === 0) {
    return false;
  }

  if (typeof provided !== "string" || provided.length === 0) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected, "utf8");
  const candidateBuffer = Buffer.from(provided, "utf8");

  if (expectedBuffer.length !== candidateBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, candidateBuffer);
}

/**
 * Constant-time check of a caller-supplied secret against ADMIN_SECRET.
 * Fails closed: returns false whenever ADMIN_SECRET is missing/empty, so admin
 * routes never authorize without an explicitly configured secret.
 */
export function verifyAdminSecret(provided: string | null | undefined): boolean {
  return matchesSecret(adminSecret, provided);
}

/** Whether a usable CRON_SECRET is configured. */
export function isCronSecretConfigured(): boolean {
  return isCronConfigured;
}

/**
 * Constant-time check of a caller-supplied secret against CRON_SECRET.
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`; pass the bare token.
 * Fails closed when CRON_SECRET is missing/empty.
 */
export function verifyCronSecret(provided: string | null | undefined): boolean {
  return matchesSecret(cronSecret, provided);
}
