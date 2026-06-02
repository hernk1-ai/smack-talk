import { NextResponse } from "next/server";

import { enforceRateLimit, jsonError, requireAuthenticatedUser } from "@/lib/security/api";
import { validateRequiredId } from "@/lib/security/contentPolicy";
import { createReport, type ReportReason, type ReportTargetType } from "@/lib/supabase/moderation";

const ALLOWED_TARGET_TYPES: ReportTargetType[] = ["take", "reply", "user"];
const ALLOWED_REASONS: ReportReason[] = [
  "harassment",
  "hate_speech",
  "spam",
  "threats",
  "impersonation",
  "inappropriate_content",
  "other",
];

/**
 * POST /api/arena/report
 */
export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser();
  if (auth.error) {
    return auth.error;
  }

  const rateLimited = enforceRateLimit({
    request,
    userId: auth.user.id,
    action: "arena-report",
    limit: 10,
    windowMs: 60_000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  const body = (await request.json().catch(() => null)) as {
    targetType?: unknown;
    targetId?: unknown;
    reason?: unknown;
    details?: unknown;
  } | null;

  if (!ALLOWED_TARGET_TYPES.includes(body?.targetType as ReportTargetType)) {
    return jsonError("Invalid report target.");
  }

  const targetIdCheck = validateRequiredId(body?.targetId, "Content");

  if (!targetIdCheck.valid) {
    return jsonError(targetIdCheck.error);
  }

  if (!ALLOWED_REASONS.includes(body?.reason as ReportReason)) {
    return jsonError("Invalid report reason.");
  }

  const details = typeof body?.details === "string" ? body.details.trim().slice(0, 500) : undefined;

  const { error } = await createReport({
    targetType: body?.targetType as ReportTargetType,
    targetId: targetIdCheck.value,
    reason: body?.reason as ReportReason,
    details,
    supabase: auth.supabase!,
    reporterUserId: auth.user.id,
  });

  if (error) {
    return jsonError(error.message, 400);
  }

  return NextResponse.json({ ok: true });
}
