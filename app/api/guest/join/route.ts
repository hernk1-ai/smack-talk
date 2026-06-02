import { NextResponse } from "next/server";

import { enforceRateLimit, jsonError } from "@/lib/security/api";
import { validateDisplayName } from "@/lib/security/contentPolicy";
import { createClient } from "@/lib/supabase/server";
import { signInAsGuest } from "@/lib/supabase/guest";

/**
 * POST /api/guest/join
 * TODO(cloudflare): apply edge rate limit (guest join / IP).
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { displayName?: unknown } | null;
  const nameCheck = validateDisplayName(body?.displayName);

  if (!nameCheck.valid) {
    return jsonError(nameCheck.error);
  }

  const rateLimited = enforceRateLimit({
    request,
    action: "guest-join",
    limit: 8,
    windowMs: 60 * 60 * 1000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  const supabase = await createClient();

  if (!supabase) {
    return jsonError("Supabase is not configured.", 503);
  }

  const { profile, user, error } = await signInAsGuest(nameCheck.value, supabase);

  if (error || !user) {
    return jsonError(error?.message ?? "Unable to join the Game Room.", 400);
  }

  return NextResponse.json({ profile, userId: user.id });
}
