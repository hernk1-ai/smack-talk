import { NextResponse } from "next/server";

import { enforceRateLimit, jsonError, requireAuthenticatedUser } from "@/lib/security/api";
import { validateCommentText, validateRequiredId } from "@/lib/security/contentPolicy";
import { createReply, deleteReply } from "@/lib/supabase/replies";

/**
 * POST /api/arena/comment
 * DELETE /api/arena/comment?replyId=
 * TODO(cloudflare): apply edge rate limit (match comments).
 */
export async function POST(request: Request) {
  const auth = await requireAuthenticatedUser();
  if (auth.error) {
    return auth.error;
  }

  const rateLimited = enforceRateLimit({
    request,
    userId: auth.user.id,
    action: "arena-comment",
    limit: 24,
    windowMs: 60_000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  const body = (await request.json().catch(() => null)) as {
    takeId?: unknown;
    replyText?: unknown;
    parentReplyId?: unknown;
  } | null;

  const takeIdCheck = validateRequiredId(body?.takeId, "Match call");
  const textCheck = validateCommentText(body?.replyText);

  if (!takeIdCheck.valid) {
    return jsonError(takeIdCheck.error);
  }

  if (!textCheck.valid) {
    return jsonError(textCheck.error);
  }

  const parentReplyId =
    typeof body?.parentReplyId === "string" && body.parentReplyId.trim() ? body.parentReplyId.trim() : null;

  const { reply, error } = await createReply({
    takeId: takeIdCheck.value,
    replyText: textCheck.value,
    parentReplyId,
    supabase: auth.supabase!,
  });

  if (error || !reply) {
    return jsonError(error?.message ?? "Unable to post comment.", 400);
  }

  return NextResponse.json({ reply });
}

export async function DELETE(request: Request) {
  const auth = await requireAuthenticatedUser();
  if (auth.error) {
    return auth.error;
  }

  const replyId = new URL(request.url).searchParams.get("replyId");
  const replyIdCheck = validateRequiredId(replyId, "Comment");

  if (!replyIdCheck.valid) {
    return jsonError(replyIdCheck.error);
  }

  const { error } = await deleteReply({
    replyId: replyIdCheck.value,
    supabase: auth.supabase!,
    userId: auth.user.id,
  });

  if (error) {
    return jsonError(error.message, 400);
  }

  return NextResponse.json({ ok: true });
}
