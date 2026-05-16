import { createClient } from "@/lib/supabase/client";
import { ACTIVE_GAME_ID } from "@/lib/supabase/games";
import { touchMyPresence } from "@/lib/supabase/presence";
import type { Take } from "@/lib/supabase/types";

type CreateLockedTakeInput = {
  gameId?: string;
  takeText: string;
};

export async function createLockedTake({ gameId, takeText }: CreateLockedTakeInput) {
  const supabase = createClient();

  if (!supabase) {
    return { take: null, error: new Error("Supabase is not configured.") };
  }

  const cleanTakeText = takeText.trim();

  if (!cleanTakeText) {
    return { take: null, error: new Error("Say it before you lock it.") };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { take: null, error: userError };
  }

  if (!user) {
    return { take: null, error: new Error("Log in to lock a take.") };
  }

  const { data, error } = await supabase
    .from("takes")
    .insert({
      user_id: user.id,
      game_id: gameId ?? ACTIVE_GAME_ID,
      take_text: cleanTakeText,
    })
    .select("*")
    .single();

  await touchMyPresence();

  return { take: data, error };
}

export async function getTakes() {
  const supabase = createClient();

  if (!supabase) {
    return { takes: [] as Take[], error: new Error("Supabase is not configured.") };
  }

  const { data, error } = await supabase.from("takes").select("*").order("created_at", { ascending: false });

  return { takes: data ?? [], error };
}

export async function getTakesByGame(gameId: string) {
  const supabase = createClient();

  if (!supabase) {
    return { takes: [] as Take[], error: new Error("Supabase is not configured.") };
  }

  const { data, error } = await supabase
    .from("takes")
    .select("*")
    .eq("game_id", gameId)
    .order("created_at", { ascending: false });

  return { takes: data ?? [], error };
}

export async function getTakesByUser(userId: string) {
  const supabase = createClient();

  if (!supabase) {
    return { takes: [] as Take[], error: new Error("Supabase is not configured.") };
  }

  const { data, error } = await supabase
    .from("takes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { takes: data ?? [], error };
}

export async function getCurrentUserTakes() {
  const supabase = createClient();

  if (!supabase) {
    return { takes: [] as Take[], error: new Error("Supabase is not configured.") };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { takes: [] as Take[], error: userError };
  }

  if (!user) {
    return { takes: [] as Take[], error: new Error("Log in to view your locked takes.") };
  }

  const { data, error } = await supabase
    .from("takes")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return { takes: data ?? [], error };
}
