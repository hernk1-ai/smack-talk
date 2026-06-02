import { NextResponse } from "next/server";

import { enforceRateLimit, jsonError, requireAuthenticatedUser } from "@/lib/security/api";
import { validateCallText, validateRequiredId } from "@/lib/security/contentPolicy";
import { ensureWorldCupGameRow, isWorldCupRouteGameId } from "@/lib/supabase/resolveArenaGame";
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

  if (isWorldCupRouteGameId(gameIdCheck.value)) {
    const { error: ensureError } = await ensureWorldCupGameRow(gameIdCheck.value);

    if (ensureError) {
      return jsonError(ensureError.message, 503);
    }
  }

  const { take, error, starterRepAwarded } = await createLockedTake({
    gameId: gameIdCheck.value,
    takeText: textCheck.value,
    supabase: auth.supabase!,
  });

  if (error || !take) {
    return jsonError(error?.message ?? "Unable to save your call.", 400);
  }

  const { data: author } = await auth.supabase!
    .from("profile_cards")
    .select("*")
    .eq("id", auth.user.id)
    .maybeSingle();

  return NextResponse.json({
    take: {
      ...take,
      author: author ?? null,
    },
    gameId: take.game_id,
    starterRepAwarded,
  });
}
