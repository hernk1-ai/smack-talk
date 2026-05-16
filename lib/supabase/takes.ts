import { createClient } from "@/lib/supabase/client";
import { ACTIVE_GAME_ID } from "@/lib/supabase/games";
import { touchMyPresence } from "@/lib/supabase/presence";
import type { Take } from "@/lib/supabase/types";

type CreateLockedTakeInput = {
  gameId?: string;
  takeText: string;
};

const TAKE_DUPLICATE_WINDOW_MS = 3 * 60 * 1000;
const TAKE_ACTION_COOLDOWN_MS = 6 * 1000;

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

  const now = Date.now();
  const targetGameId = gameId ?? ACTIVE_GAME_ID;
  const windowCutoffIso = new Date(now - TAKE_DUPLICATE_WINDOW_MS).toISOString();

  const { data: recentTakes, error: recentError } = await supabase
    .from("takes")
    .select("take_text, created_at")
    .eq("user_id", user.id)
    .eq("game_id", targetGameId)
    .gte("created_at", windowCutoffIso)
    .order("created_at", { ascending: false })
    .limit(10);

  if (recentError) {
    return { take: null, error: recentError };
  }

  const duplicateTake = (recentTakes ?? []).find(
    (candidate) => candidate.take_text.trim().toLowerCase() === cleanTakeText.toLowerCase(),
  );

  if (duplicateTake) {
    return { take: null, error: new Error("That take is already live. Switch your angle before locking again.") };
  }

  const latestTake = (recentTakes ?? [])[0];

  if (latestTake) {
    const latestCreatedAt = new Date(latestTake.created_at).getTime();
    if (Number.isFinite(latestCreatedAt) && now - latestCreatedAt < TAKE_ACTION_COOLDOWN_MS) {
      return { take: null, error: new Error("Slow down. Give it a few seconds before locking another take.") };
    }
  }

  const { data, error } = await supabase
    .from("takes")
    .insert({
      user_id: user.id,
      game_id: targetGameId,
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

  const { data, error } = await supabase
    .from("takes")
    .select("*")
    .eq("is_hidden", false)
    .order("created_at", { ascending: false });

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
    .eq("is_hidden", false)
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
    .eq("is_hidden", false)
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
    .eq("is_hidden", false)
    .order("created_at", { ascending: false });

  return { takes: data ?? [], error };
}
