import { ACTIVE_GAME_ID } from "@/lib/supabase/games";
import { createClient } from "@/lib/supabase/client";

export async function settleGameForDev(result: "hit" | "miss", gameId = ACTIVE_GAME_ID) {
  const supabase = createClient();

  if (!supabase) {
    return { rows: [], error: new Error("Supabase is not configured.") };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { rows: [], error: userError ?? new Error("You must be logged in to settle a game.") };
  }

  const { data, error } = await supabase.rpc("dev_settle_game", {
    target_game_id: gameId,
    settle_result: result,
  });

  return { rows: data ?? [], error };
}

export async function settlePendingGame(gameId: string, result: "hit" | "miss") {
  return settleGameForDev(result, gameId);
}

export async function handleGameFinalized(gameId: string) {
  return {
    rows: [],
    error: new Error(`Automatic settlement is not enabled yet for ${gameId}. Use dev settlement while MVP scoring is manual.`),
  };
}
