import { NextResponse } from "next/server";

import { enforceRateLimit, jsonError } from "@/lib/security/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseAdminSetupError } from "@/lib/supabase/env";
import { getFeaturedMatchHubNewsVideo } from "@/lib/worldCup/worldCupVideos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit({
    request,
    action: "match-hub-news",
    limit: 60,
    windowMs: 60_000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  const setupError = getSupabaseAdminSetupError();
  if (setupError) {
    return jsonError("Supabase is not configured.", 503);
  }

  const admin = createAdminClient();
  if (!admin) {
    return jsonError("Supabase is not configured.", 503);
  }

  const { video, error } = await getFeaturedMatchHubNewsVideo(admin);

  if (error) {
    return jsonError(error, 500);
  }

  return NextResponse.json({ video });
}
