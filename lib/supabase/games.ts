import { createClient } from "@/lib/supabase/client";
import type { Game } from "@/lib/supabase/types";

export const ACTIVE_GAME_ID = "lal-gsw-live";

export async function getLiveGames() {
  const supabase = createClient();

  if (!supabase) {
    return { games: [] as Game[], error: new Error("Supabase is not configured.") };
  }

  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("status", "live")
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
