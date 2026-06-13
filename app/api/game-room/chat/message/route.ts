import { NextResponse } from "next/server";

import { updateMatchRoomMessage } from "@/lib/gameRoom/chatServer";
import { validateMessageId, validateVoterKey } from "@/lib/gameRoom/validation";
import { validateRoomChatMessage } from "@/lib/gameRoom/chatValidation";
import { enforceRateLimit, jsonError } from "@/lib/security/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseAdminSetupError } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function PATCH(request: Request) {
  const rateLimited = enforceRateLimit({
    request,
    action: "game-room-chat-edit",
    limit: 30,
    windowMs: 60_000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  const body = (await request.json().catch(() => null)) as
    | {
        messageId?: unknown;
        newBody?: unknown;
        senderKey?: unknown;
      }
    | null;

  const messageIdCheck = validateMessageId(body?.messageId);
  const senderKeyCheck = validateVoterKey(body?.senderKey);
  const messageCheck = validateRoomChatMessage(typeof body?.newBody === "string" ? body.newBody : "");

  if (!messageIdCheck.valid) {
    return jsonError(messageIdCheck.error);
  }

  if (!senderKeyCheck.valid) {
    return jsonError(senderKeyCheck.error);
  }

  if (!messageCheck.valid) {
    return jsonError(messageCheck.error);
  }

  const { admin, error: adminError } = getAdminOrError();
  if (adminError || !admin) {
    return adminError ?? jsonError("Supabase is not configured.", 503);
  }

  let userId: string | null = null;
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }

  const { error, message } = await updateMatchRoomMessage(admin, {
    messageId: messageIdCheck.value,
    messageText: messageCheck.value,
    senderKey: senderKeyCheck.value,
    userId,
  });

  if (error || !message) {
    const status = error === "You can only edit your own messages." ? 403 : error === "This message can no longer be edited." ? 400 : 500;
    return jsonError(error ?? "Unable to edit message.", status);
  }

  return NextResponse.json({ message });
}
