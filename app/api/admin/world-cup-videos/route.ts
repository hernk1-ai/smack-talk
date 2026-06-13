import { NextResponse } from "next/server";

import { ADMIN_SECRET_HEADER, isAdminSecretConfigured, verifyAdminSecret } from "@/lib/admin/secret";
import { enforceRateLimit, jsonError } from "@/lib/security/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseAdminSetupError } from "@/lib/supabase/env";
import {
  createWorldCupVideo,
  listActiveWorldCupVideos,
  updateWorldCupVideoActive,
  WORLD_CUP_VIDEO_CATEGORIES,
  type WorldCupVideoCategory,
  type WorldCupVideoInput,
} from "@/lib/worldCup/worldCupVideos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorizeAdmin(request: Request): NextResponse | null {
  if (!isAdminSecretConfigured()) {
    return jsonError("Admin control is not configured.", 503);
  }

  if (!verifyAdminSecret(request.headers.get(ADMIN_SECRET_HEADER))) {
    return jsonError("Unauthorized.", 401);
  }

  return null;
}

function getAdminOrError() {
  const setupError = getSupabaseAdminSetupError();
  if (setupError) {
    return { admin: null, error: jsonError("Supabase is not configured.", 503) };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { admin: null, error: jsonError("Supabase is not configured.", 503) };
  }

  return { admin, error: null };
}

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit({
    request,
    action: "admin-world-cup-videos-list",
    limit: 30,
    windowMs: 60_000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  const unauthorized = authorizeAdmin(request);
  if (unauthorized) {
    return unauthorized;
  }

  const { admin, error: adminError } = getAdminOrError();
  if (adminError || !admin) {
    return adminError ?? jsonError("Supabase is not configured.", 503);
  }

  const { videos, error } = await listActiveWorldCupVideos(admin);
  if (error || !videos) {
    return jsonError(error ?? "Unable to load videos.", 500);
  }

  return NextResponse.json({ videos, categories: WORLD_CUP_VIDEO_CATEGORIES });
}

export async function POST(request: Request) {
  const rateLimited = enforceRateLimit({
    request,
    action: "admin-world-cup-videos-create",
    limit: 20,
    windowMs: 60_000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  const unauthorized = authorizeAdmin(request);
  if (unauthorized) {
    return unauthorized;
  }

  const body = (await request.json().catch(() => null)) as Partial<WorldCupVideoInput> | null;
  const category = typeof body?.category === "string" ? body.category : "general";

  const { admin, error: adminError } = getAdminOrError();
  if (adminError || !admin) {
    return adminError ?? jsonError("Supabase is not configured.", 503);
  }

  const { video, error } = await createWorldCupVideo(admin, {
    title: typeof body?.title === "string" ? body.title : "",
    youtubeUrl: typeof body?.youtubeUrl === "string" ? body.youtubeUrl : "",
    sourceLabel: typeof body?.sourceLabel === "string" ? body.sourceLabel : null,
    category: (WORLD_CUP_VIDEO_CATEGORIES as readonly string[]).includes(category)
      ? (category as WorldCupVideoCategory)
      : "general",
    relatedMatchId: typeof body?.relatedMatchId === "string" ? body.relatedMatchId : null,
    relatedTeam: typeof body?.relatedTeam === "string" ? body.relatedTeam : null,
    startsShowingAt: typeof body?.startsShowingAt === "string" ? body.startsShowingAt : null,
    expiresAt: typeof body?.expiresAt === "string" ? body.expiresAt : null,
    priority: typeof body?.priority === "number" ? body.priority : Number(body?.priority) || 0,
    isActive: typeof body?.isActive === "boolean" ? body.isActive : true,
  });

  if (error || !video) {
    return jsonError(error ?? "Unable to save video.", 400);
  }

  return NextResponse.json({ video });
}

export async function PATCH(request: Request) {
  const rateLimited = enforceRateLimit({
    request,
    action: "admin-world-cup-videos-update",
    limit: 30,
    windowMs: 60_000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  const unauthorized = authorizeAdmin(request);
  if (unauthorized) {
    return unauthorized;
  }

  const body = (await request.json().catch(() => null)) as { id?: unknown; isActive?: unknown } | null;
  const id = typeof body?.id === "string" ? body.id.trim() : "";
  const isActive = body?.isActive;

  if (!id) {
    return jsonError("Video id is required.");
  }

  if (typeof isActive !== "boolean") {
    return jsonError("isActive must be a boolean.");
  }

  const { admin, error: adminError } = getAdminOrError();
  if (adminError || !admin) {
    return adminError ?? jsonError("Supabase is not configured.", 503);
  }

  const { video, error } = await updateWorldCupVideoActive(admin, id, isActive);
  if (error || !video) {
    return jsonError(error ?? "Unable to update video.", 500);
  }

  return NextResponse.json({ video });
}
