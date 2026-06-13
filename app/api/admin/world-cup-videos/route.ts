import { NextResponse } from "next/server";

import { ADMIN_SECRET_HEADER, isAdminSecretConfigured, verifyAdminSecret } from "@/lib/admin/secret";
import { enforceRateLimit, jsonError } from "@/lib/security/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseAdminSetupError } from "@/lib/supabase/env";
import { WORLD_CUP_VIDEO_MATCH_PHASES, type WorldCupVideoMatchPhase } from "@/lib/worldCup/matchPhase";
import {
  createWorldCupVideo,
  listActiveWorldCupVideos,
  updateWorldCupVideo,
  updateWorldCupVideoActive,
  WORLD_CUP_VIDEO_CATEGORIES,
  type WorldCupVideoCategory,
  type WorldCupVideoInput,
  type WorldCupVideoUpdateInput,
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

function parseCategory(value: unknown): WorldCupVideoCategory {
  const category = typeof value === "string" ? value : "general";
  return (WORLD_CUP_VIDEO_CATEGORIES as readonly string[]).includes(category)
    ? (category as WorldCupVideoCategory)
    : "general";
}

function parseMatchPhase(value: unknown): WorldCupVideoMatchPhase {
  const matchPhase = typeof value === "string" ? value : "any";
  return (WORLD_CUP_VIDEO_MATCH_PHASES as readonly string[]).includes(matchPhase)
    ? (matchPhase as WorldCupVideoMatchPhase)
    : "any";
}

function parsePriority(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
  }

  return 0;
}

function isFullVideoUpdate(body: Record<string, unknown> | null) {
  if (!body) {
    return false;
  }

  return (
    typeof body.title === "string" ||
    typeof body.youtubeUrl === "string" ||
    typeof body.youtube_url === "string" ||
    typeof body.youtube_id === "string" ||
    typeof body.sourceLabel === "string" ||
    typeof body.source_label === "string" ||
    typeof body.category === "string" ||
    typeof body.matchPhase === "string" ||
    typeof body.match_phase === "string" ||
    typeof body.relatedMatchId === "string" ||
    typeof body.related_match_id === "string" ||
    typeof body.relatedTeam === "string" ||
    typeof body.related_team === "string" ||
    typeof body.priority === "number" ||
    typeof body.priority === "string"
  );
}

function parseVideoUpdateInput(body: Record<string, unknown>): WorldCupVideoUpdateInput {
  return {
    id: typeof body.id === "string" ? body.id : "",
    title: typeof body.title === "string" ? body.title : "",
    sourceLabel:
      typeof body.sourceLabel === "string"
        ? body.sourceLabel
        : typeof body.source_label === "string"
          ? body.source_label
          : null,
    youtubeUrl:
      typeof body.youtubeUrl === "string"
        ? body.youtubeUrl
        : typeof body.youtube_url === "string"
          ? body.youtube_url
          : undefined,
    youtubeId: typeof body.youtube_id === "string" ? body.youtube_id : undefined,
    category: parseCategory(body.category),
    relatedMatchId:
      typeof body.relatedMatchId === "string"
        ? body.relatedMatchId
        : typeof body.related_match_id === "string"
          ? body.related_match_id
          : null,
    relatedTeam:
      typeof body.relatedTeam === "string"
        ? body.relatedTeam
        : typeof body.related_team === "string"
          ? body.related_team
          : null,
    matchPhase: parseMatchPhase(
      typeof body.matchPhase === "string"
        ? body.matchPhase
        : typeof body.match_phase === "string"
          ? body.match_phase
          : "any",
    ),
    priority: parsePriority(body.priority),
    isActive:
      typeof body.isActive === "boolean"
        ? body.isActive
        : typeof body.is_active === "boolean"
          ? body.is_active
          : true,
  };
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

  return NextResponse.json({ videos, categories: WORLD_CUP_VIDEO_CATEGORIES, phases: WORLD_CUP_VIDEO_MATCH_PHASES });
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
  const matchPhase = typeof body?.matchPhase === "string" ? body.matchPhase : "any";

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
    matchPhase: (WORLD_CUP_VIDEO_MATCH_PHASES as readonly string[]).includes(matchPhase)
      ? (matchPhase as WorldCupVideoMatchPhase)
      : "any",
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

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = typeof body?.id === "string" ? body.id.trim() : "";

  if (!id) {
    return jsonError("Video id is required.");
  }

  const { admin, error: adminError } = getAdminOrError();
  if (adminError || !admin) {
    return adminError ?? jsonError("Supabase is not configured.", 503);
  }

  if (isFullVideoUpdate(body)) {
    const { video, error } = await updateWorldCupVideo(admin, parseVideoUpdateInput({ ...body, id }));
    if (error || !video) {
      return jsonError(error ?? "Unable to update video.", 400);
    }

    return NextResponse.json({ video });
  }

  const isActive =
    typeof body?.isActive === "boolean"
      ? body.isActive
      : typeof body?.is_active === "boolean"
        ? body.is_active
        : null;

  if (typeof isActive !== "boolean") {
    return jsonError("Provide edit fields or isActive.");
  }

  const { video, error } = await updateWorldCupVideoActive(admin, id, isActive);
  if (error || !video) {
    return jsonError(error ?? "Unable to update video.", 500);
  }

  return NextResponse.json({ video });
}
