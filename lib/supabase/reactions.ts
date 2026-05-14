import { createClient } from "@/lib/supabase/client";
import type { Take, TakeReaction } from "@/lib/supabase/types";

type ReactionSide = TakeReaction["reaction"];

type ReactToTakeInput = {
  takeId: string;
  reaction: ReactionSide;
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
    return { reaction: null, error: new Error("Log in to react to takes.") };
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

export async function reactToTake({ takeId, reaction }: ReactToTakeInput) {
  const supabase = createClient();

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
    return { reaction: null, take: null, error: new Error("Log in to ride or fade takes.") };
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

  return { reaction: savedReaction, take, error: takeError };
}
