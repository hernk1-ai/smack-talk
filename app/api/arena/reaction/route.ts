import { NextResponse } from "next/server";

import { enforceRateLimit, jsonError, requireAuthenticatedUser } from "@/lib/security/api";
import { validateRequiredId } from "@/lib/security/contentPolicy";
import { reactToTake } from "@/lib/supabase/reactions";

/**
 * POST /api/arena/reaction
 * TODO(cloudflare): apply edge rate limit (ride/fade reactions).
 */
export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser();
  if (auth.error) {
    return auth.error;
  }

  const rateLimited = enforceRateLimit({
    request,
    userId: auth.user.id,
    action: "arena-reaction",
    limit: 40,
    windowMs: 60_000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  const body = (await request.json().catch(() => null)) as { takeId?: unknown; reaction?: unknown } | null;
  const takeIdCheck = validateRequiredId(body?.takeId, "Match call");

  if (!takeIdCheck.valid) {
    return jsonError(takeIdCheck.error);
  }

  if (body?.reaction !== "ride" && body?.reaction !== "fade") {
    return jsonError("Reaction must be ride or fade.");
  }

  const { reaction, take, error } = await reactToTake({
    takeId: takeIdCheck.value,
    reaction: body.reaction,
    supabase: auth.supabase!,
  });

  if (error) {
    return jsonError(error.message, 400);
  }

  return NextResponse.json({ reaction, take });
}
