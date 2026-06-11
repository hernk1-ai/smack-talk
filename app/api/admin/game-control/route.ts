import { NextResponse } from "next/server";

import {
  listWorldCupGames,
  updateWorldCupGame,
  validateGameId,
  validateGameUpdate,
} from "@/lib/admin/gameControl";
import { ADMIN_SECRET_HEADER, isAdminSecretConfigured, verifyAdminSecret } from "@/lib/admin/secret";
import { enforceRateLimit, jsonError } from "@/lib/security/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseAdminSetupError } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Authorize an admin request, or return an error response to send back. */
function authorizeAdmin(request: Request): NextResponse | null {
  // Fail closed: without a configured secret, the panel is fully disabled.
  if (!isAdminSecretConfigured()) {
    return jsonError("Admin control is not configured.", 503);
  }

  if (!verifyAdminSecret(request.headers.get(ADMIN_SECRET_HEADER))) {
    return jsonError("Unauthorized.", 401);
  }

  return null;
}

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit({ request, action: "admin-game-control", limit: 30, windowMs: 60 * 1000 });
  if (rateLimited) {
    return rateLimited;
  }

  const unauthorized = authorizeAdmin(request);
  if (unauthorized) {
    return unauthorized;
  }

  const admin = createAdminClient();
  if (!admin) {
    return jsonError(getSupabaseAdminSetupError() ?? "Supabase admin client is not configured.", 503);
  }

  const { error, games } = await listWorldCupGames(admin);
  if (error) {
    return jsonError("Unable to load World Cup games.", 500);
  }

  return NextResponse.json({ games });
}

export async function PATCH(request: Request) {
  const rateLimited = enforceRateLimit({ request, action: "admin-game-control", limit: 30, windowMs: 60 * 1000 });
  if (rateLimited) {
    return rateLimited;
  }

  const unauthorized = authorizeAdmin(request);
  if (unauthorized) {
    return unauthorized;
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  const idCheck = validateGameId(body?.id);
  if (!idCheck.valid) {
    return jsonError(idCheck.error);
  }

  const updateCheck = validateGameUpdate(body);
  if (!updateCheck.valid) {
    return jsonError(updateCheck.error);
  }

  const admin = createAdminClient();
  if (!admin) {
    return jsonError(getSupabaseAdminSetupError() ?? "Supabase admin client is not configured.", 503);
  }

  const { error, game } = await updateWorldCupGame(admin, idCheck.value, updateCheck.value);
  if (error) {
    return jsonError("Unable to update the game.", 500);
  }

  if (!game) {
    return jsonError("World Cup game not found.", 404);
  }

  return NextResponse.json({ game });
}
