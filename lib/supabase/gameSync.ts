import { fetchEspnNbaGames } from "@/lib/sports/espnNba";
import { createAdminClient } from "@/lib/supabase/admin";

export async function syncNbaGames({ date }: { date?: string } = {}) {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      games: [],
      error: new Error("SUPABASE_SERVICE_ROLE_KEY is required to sync live games server-side."),
    };
  }

  const games = await fetchEspnNbaGames(date);

  if (!games.length) {
    return { games: [], error: null };
  }

  const { data, error } = await supabase
    .from("games")
    .upsert(games, {
      onConflict: "id",
    })
    .select("*");

  return {
    games: data ?? [],
    error,
  };
}
