import { createClient } from "@/lib/supabase/client";
import { validateCommentText } from "@/lib/security/contentPolicy";
import { getMyModerationFilters } from "@/lib/supabase/moderation";
import { createNotification } from "@/lib/supabase/notifications";
import { touchMyPresence } from "@/lib/supabase/presence";
import type { AppSupabaseClient } from "@/lib/supabase/typedClient";
import type { ProfileCard, TakeReply } from "@/lib/supabase/types";

export type TakeReplyWithAuthor = TakeReply & {
  author: ProfileCard | null;
};

const REPLY_DUPLICATE_WINDOW_MS = 2 * 60 * 1000;
const REPLY_ACTION_COOLDOWN_MS = 4 * 1000;

export async function getRepliesForTake(takeId: string) {
  const supabase = createClient();

  if (!supabase) {
    return { replies: [] as TakeReplyWithAuthor[], error: new Error("Supabase is not configured.") };
  }

  const { mutedUserIds, blockedUserIds } = await getMyModerationFilters();
  const excludedUserIds = new Set([...mutedUserIds, ...blockedUserIds]);

  const { data: replies, error } = await supabase
    .from("take_replies")
    .select("*")
    .eq("take_id", takeId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false });

  if (error || !replies?.length) {
    return { replies: [] as TakeReplyWithAuthor[], error };
  }

  const visibleReplies = replies.filter((reply) => !excludedUserIds.has(reply.user_id));

  if (!visibleReplies.length) {
    return { replies: [], error: null };
  }

  const userIds = [...new Set(visibleReplies.map((reply) => reply.user_id))];
  const { data: profileCards } = await supabase.from("profile_cards").select("*").in("id", userIds);
  const profileMap = new Map((profileCards ?? []).map((profileCard) => [profileCard.id, profileCard]));

  return {
    replies: visibleReplies.map((reply) => ({
      ...reply,
      author: profileMap.get(reply.user_id) ?? null,
    })),
    error: null,
  };
}

export async function createReply({
  takeId,
  replyText,
  parentReplyId,
  supabase: supabaseOverride,
}: {
  takeId: string;
  replyText: string;
  parentReplyId?: string | null;
  supabase?: AppSupabaseClient;
}) {
  const supabase = supabaseOverride ?? createClient();

  if (!supabase) {
    return { reply: null as TakeReply | null, error: new Error("Supabase is not configured.") };
  }

  const textCheck = validateCommentText(replyText);

  if (!textCheck.valid) {
    return { reply: null, error: new Error(textCheck.error) };
  }

  const cleanReplyText = textCheck.value;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { reply: null, error: userError };
  }

  if (!user) {
    return { reply: null, error: new Error("Join the Game Room to comment.") };
  }

  const now = Date.now();
  const recentWindowIso = new Date(now - REPLY_DUPLICATE_WINDOW_MS).toISOString();
  const { data: recentReplies, error: recentError } = await supabase
    .from("take_replies")
    .select("reply_text, created_at")
    .eq("take_id", takeId)
    .eq("user_id", user.id)
    .gte("created_at", recentWindowIso)
    .order("created_at", { ascending: false })
    .limit(10);

  if (recentError) {
    return { reply: null, error: recentError };
  }

  const duplicateReply = (recentReplies ?? []).find(
    (candidate) => candidate.reply_text.trim().toLowerCase() === cleanReplyText.toLowerCase(),
  );

  if (duplicateReply) {
    return { reply: null, error: new Error("You already said that. Keep the thread moving.") };
  }

  const latestReply = (recentReplies ?? [])[0];
  if (latestReply) {
    const latestCreatedAt = new Date(latestReply.created_at).getTime();
    if (Number.isFinite(latestCreatedAt) && now - latestCreatedAt < REPLY_ACTION_COOLDOWN_MS) {
      return { reply: null, error: new Error("Slow down. Give it a few seconds before replying again.") };
    }
  }

  const { data, error } = await supabase
    .from("take_replies")
    .insert({
      take_id: takeId,
      user_id: user.id,
      reply_text: cleanReplyText,
      parent_reply_id: parentReplyId ?? null,
    })
    .select("*")
    .single();

  if (data && !error) {
    const { data: take } = await supabase.from("takes").select("id, user_id, take_text").eq("id", takeId).maybeSingle();
    if (take?.user_id) {
      await createNotification({
        userId: take.user_id,
        type: "take_replied",
        title: "New reply on your take.",
        body: cleanReplyText.slice(0, 120),
        entityType: "take",
        entityId: take.id,
      });
    }
  }

  if (!supabaseOverride) {
    await touchMyPresence();
  }

  return { reply: data, error };
}

export async function deleteReply({
  replyId,
  supabase: supabaseOverride,
  userId,
}: {
  replyId: string;
  supabase?: AppSupabaseClient;
  userId?: string;
}) {
  const supabase = supabaseOverride ?? createClient();

  if (!supabase) {
    return { error: new Error("Supabase is not configured.") };
  }

  let ownerId = userId;

  if (!ownerId) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return { error: userError };
    }

    if (!user) {
      return { error: new Error("Join the Game Room to manage comments.") };
    }

    ownerId = user.id;
  }

  const { data: existing, error: fetchError } = await supabase
    .from("take_replies")
    .select("id, user_id")
    .eq("id", replyId)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError };
  }

  if (!existing) {
    return { error: new Error("Comment not found.") };
  }

  if (existing.user_id !== ownerId) {
    return { error: new Error("You can only delete your own comments.") };
  }

  const { error } = await supabase.from("take_replies").delete().eq("id", replyId).eq("user_id", ownerId);

  return { error: error ?? null };
}
