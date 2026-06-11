import { timingSafeEqual } from "node:crypto";

import { adminSecret, isAdminConfigured } from "@/lib/supabase/env";

export const ADMIN_SECRET_HEADER = "x-admin-secret";

/** Whether a usable ADMIN_SECRET is configured. */
export function isAdminSecretConfigured(): boolean {
  return isAdminConfigured;
}

/**
 * Constant-time check of a caller-supplied secret against ADMIN_SECRET.
 * Fails closed: returns false whenever ADMIN_SECRET is missing/empty, so admin
 * routes never authorize without an explicitly configured secret.
 */
export function verifyAdminSecret(provided: string | null | undefined): boolean {
  if (!adminSecret || adminSecret.trim().length === 0) {
    return false;
  }

  if (typeof provided !== "string" || provided.length === 0) {
    return false;
  }

  const expected = Buffer.from(adminSecret, "utf8");
  const candidate = Buffer.from(provided, "utf8");

  if (expected.length !== candidate.length) {
    return false;
  }

  return timingSafeEqual(expected, candidate);
}
