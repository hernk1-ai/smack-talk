import { createClient } from "@/lib/supabase/client";
import type { ProfileCard, TakeReply } from "@/lib/supabase/types";

export type TakeReplyWithAuthor = TakeReply & {
  author: ProfileCard | null;
};

export async function getRepliesForTake(takeId: string) {
  const supabase = createClient();

  if (!supabase) {
    return { replies: [] as TakeReplyWithAuthor[], error: new Error("Supabase is not configured.") };
  }

  const { data: replies, error } = await supabase
    .from("take_replies")
    .select("*")
    .eq("take_id", takeId)
    .order("created_at", { ascending: true });

  if (error || !replies?.length) {
    return { replies: [] as TakeReplyWithAuthor[], error };
  }

  const userIds = [...new Set(replies.map((reply) => reply.user_id))];
  const { data: profileCards } = await supabase.from("profile_cards").select("*").in("id", userIds);
  const profileMap = new Map((profileCards ?? []).map((profileCard) => [profileCard.id, profileCard]));

  return {
    replies: replies.map((reply) => ({
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
}: {
  takeId: string;
  replyText: string;
  parentReplyId?: string | null;
}) {
  const supabase = createClient();

  if (!supabase) {
    return { reply: null as TakeReply | null, error: new Error("Supabase is not configured.") };
  }

  const cleanReplyText = replyText.trim();

  if (!cleanReplyText) {
    return { reply: null, error: new Error("Say something before you reply.") };
  }

  if (cleanReplyText.length > 280) {
    return { reply: null, error: new Error("Keep replies under 280 characters.") };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { reply: null, error: userError };
  }

  if (!user) {
    return { reply: null, error: new Error("Log in to reply to takes.") };
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

  return { reply: data, error };
}
