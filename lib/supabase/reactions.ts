import { createClient } from "@/lib/supabase/client";
import { createNotification } from "@/lib/supabase/notifications";
import { touchMyPresence } from "@/lib/supabase/presence";
import type { AppSupabaseClient } from "@/lib/supabase/typedClient";
import type { Take, TakeReaction } from "@/lib/supabase/types";

type ReactionSide = TakeReaction["reaction"];

type ReactToTakeInput = {
  takeId: string;
  reaction: ReactionSide;
  supabase?: AppSupabaseClient;
};

export async function getReactionsForTake(takeId: string) {
  const supabase = createClient();

  if (!supabase) {
    return { reactions: [] as TakeReaction[], error: new Error("Supabase is not configured.") };
  }

  const { data, error } = await supabase
    .from("take_reactions")
    .select("*")
    .eq("take_id", takeId)
    .order("created_at", { ascending: false });

  return { reactions: data ?? [], error };
}

export async function getMyReactionForTake(takeId: string) {
  const supabase = createClient();

  if (!supabase) {
    return { reaction: null as TakeReaction | null, error: new Error("Supabase is not configured.") };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { reaction: null, error: userError };
  }

  if (!user) {
    return { reaction: null, error: new Error("Join the Game Room to react.") };
  }

  const { data, error } = await supabase
    .from("take_reactions")
    .select("*")
    .eq("take_id", takeId)
    .eq("user_id", user.id)
    .maybeSingle();

  return { reaction: data, error };
}

export async function getMyReactionsForTakes(takeIds: string[]) {
  const supabase = createClient();

  if (!supabase || takeIds.length === 0) {
    return { reactions: [] as TakeReaction[], error: supabase ? null : new Error("Supabase is not configured.") };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { reactions: [] as TakeReaction[], error: userError };
  }

  if (!user) {
    return { reactions: [] as TakeReaction[], error: new Error("Log in to view your reactions.") };
  }

  const { data, error } = await supabase
    .from("take_reactions")
    .select("*")
    .eq("user_id", user.id)
    .in("take_id", takeIds);

  return { reactions: data ?? [], error };
}

export async function reactToTake({ takeId, reaction, supabase: supabaseOverride }: ReactToTakeInput) {
  const supabase = supabaseOverride ?? createClient();

  if (!supabase) {
    return { reaction: null as TakeReaction | null, take: null as Take | null, error: new Error("Supabase is not configured.") };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { reaction: null, take: null, error: userError };
  }

  if (!user) {
    return { reaction: null, take: null, error: new Error("Join the Game Room to ride or fade.") };
  }

  const { data: existingReaction, error: existingError } = await supabase
    .from("take_reactions")
    .select("*")
    .eq("take_id", takeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) {
    return { reaction: null, take: null, error: existingError };
  }

  if (existingReaction?.reaction === reaction) {
    const { data: take, error: takeError } = await supabase.from("takes").select("*").eq("id", takeId).maybeSingle();
    return { reaction: existingReaction, take, error: takeError };
  }

  const reactionMutation = existingReaction
    ? supabase.from("take_reactions").update({ reaction }).eq("id", existingReaction.id).select("*").single()
    : supabase
        .from("take_reactions")
        .insert({
          take_id: takeId,
          user_id: user.id,
          reaction,
        })
        .select("*")
        .single();

  const { data: savedReaction, error: reactionError } = await reactionMutation;

  if (reactionError) {
    return { reaction: null, take: null, error: reactionError };
  }

  const { data: take, error: takeError } = await supabase.from("takes").select("*").eq("id", takeId).maybeSingle();

  if (take && !takeError) {
    await createNotification({
      userId: take.user_id,
      type: reaction === "ride" ? "take_rode" : "take_faded",
      title: reaction === "ride" ? "Someone rode your take." : "Someone faded your take.",
      body: take.take_text.slice(0, 120),
      entityType: "take",
      entityId: take.id,
    });
  }

  if (!supabaseOverride) {
    await touchMyPresence();
  }

  return { reaction: savedReaction, take, error: takeError };
}
