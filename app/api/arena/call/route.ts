import { NextResponse } from "next/server";

import { enforceRateLimit, jsonError, requireAuthenticatedUser } from "@/lib/security/api";
import { validateCallText, validateRequiredId } from "@/lib/security/contentPolicy";
import { createLockedTake } from "@/lib/supabase/takes";

/**
 * POST /api/arena/call
 * TODO(cloudflare): apply edge rate limit (match calls).
 */
export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser();
  if (auth.error) {
    return auth.error;
  }

  const rateLimited = enforceRateLimit({
    request,
    userId: auth.user.id,
    action: "arena-call",
    limit: 12,
    windowMs: 60_000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  const body = (await request.json().catch(() => null)) as { gameId?: unknown; takeText?: unknown } | null;
  const gameIdCheck = validateRequiredId(body?.gameId, "Match");
  const textCheck = validateCallText(body?.takeText);

  if (!gameIdCheck.valid) {
    return jsonError(gameIdCheck.error);
  }

  if (!textCheck.valid) {
    return jsonError(textCheck.error);
  }

  const { take, error, starterRepAwarded } = await createLockedTake({
    gameId: gameIdCheck.value,
    takeText: textCheck.value,
    supabase: auth.supabase!,
  });

  if (error || !take) {
    return jsonError(error?.message ?? "Unable to save your call.", 400);
  }

  return NextResponse.json({ take, starterRepAwarded });
}
