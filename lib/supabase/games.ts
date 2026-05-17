import { createClient } from "@/lib/supabase/client";
import type { Game, GamePick } from "@/lib/supabase/types";

export const ACTIVE_GAME_ID = "wc-usa-par-live";
export type GamePickSide = "ride" | "fade";

export async function getLiveGames() {
  return getGamesByStatuses(["live"]);
}

export async function getArenaGames() {
  return getGamesByStatuses(["live", "scheduled", "final"]);
}

async function getGamesByStatuses(statuses: Game["status"][]) {
  const supabase = createClient();

  if (!supabase) {
    return { games: [] as Game[], error: new Error("Supabase is not configured.") };
  }

  const { data, error } = await supabase
    .from("games")
    .select("*")
    .in("status", statuses)
    .order("starts_at", { ascending: true, nullsFirst: false })
    .order("heat", { ascending: false });

  return { games: data ?? [], error };
}

export async function getGameById(gameId: string) {
  const supabase = createClient();

  if (!supabase) {
    return { game: null as Game | null, error: new Error("Supabase is not configured.") };
  }

  const { data, error } = await supabase.from("games").select("*").eq("id", gameId).maybeSingle();

  return { game: data, error };
}

export async function getMyGamePick(gameId: string) {
  const supabase = createClient();

  if (!supabase) {
    return { gamePick: null as GamePick | null, error: new Error("Supabase is not configured.") };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { gamePick: null as GamePick | null, error: userError ?? new Error("You must be logged in.") };
  }

  const { data, error } = await supabase
    .from("game_picks")
    .select("*")
    .eq("user_id", user.id)
    .eq("game_id", gameId)
    .maybeSingle();

  return { gamePick: data, error };
}

export async function createGamePick({ gameId, pick }: { gameId: string; pick: GamePickSide }) {
  const supabase = createClient();

  if (!supabase) {
    return { gamePick: null as GamePick | null, error: new Error("Supabase is not configured.") };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { gamePick: null as GamePick | null, error: userError ?? new Error("You must be logged in.") };
  }

  const { data, error } = await supabase
    .from("game_picks")
    .insert({
      user_id: user.id,
      game_id: gameId,
      pick,
      is_locked: true,
      locked_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (!error) {
    return { gamePick: data, error: null };
  }

  if (error.code === "23505") {
    return getMyGamePick(gameId);
  }

  return { gamePick: null as GamePick | null, error };
}
