import { createClient } from "@/lib/supabase/client";
import { touchMyPresence } from "@/lib/supabase/presence";
import type { QuickPick } from "@/lib/supabase/types";

export type QuickPickType = "momentum" | "scoring" | "tempo" | "clutch" | "outcome";
export type QuickPickSide = string;

export async function getMyQuickPicks(gameId: string) {
  const supabase = createClient();

  if (!supabase) {
    return { quickPicks: [] as QuickPick[], error: new Error("Supabase is not configured.") };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { quickPicks: [] as QuickPick[], error: userError };
  }

  if (!user) {
    return { quickPicks: [] as QuickPick[], error: new Error("Log in to make quick picks.") };
  }

  const { data, error } = await supabase
    .from("quick_picks")
    .select("*")
    .eq("user_id", user.id)
    .eq("game_id", gameId)
    .order("created_at", { ascending: false });

  return { quickPicks: data ?? [], error };
}

export async function getCurrentUserQuickPicks() {
  const supabase = createClient();

  if (!supabase) {
    return { quickPicks: [] as QuickPick[], error: new Error("Supabase is not configured.") };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { quickPicks: [] as QuickPick[], error: userError };
  }

  if (!user) {
    return { quickPicks: [] as QuickPick[], error: new Error("Log in to view quick picks.") };
  }

  const { data, error } = await supabase
    .from("quick_picks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return { quickPicks: data ?? [], error };
}

export async function createQuickPick({
  gameId,
  questionText,
  selectedSide,
  pickType,
  promptKey,
}: {
  gameId: string;
  questionText: string;
  selectedSide: QuickPickSide;
  pickType: QuickPickType;
  promptKey: string;
}) {
  const supabase = createClient();

  if (!supabase) {
    return { quickPick: null as QuickPick | null, error: new Error("Supabase is not configured.") };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { quickPick: null, error: userError };
  }

  if (!user) {
    return { quickPick: null, error: new Error("Log in to make quick picks.") };
  }

  const { gameId: targetGameId, error: gameError } = await resolveQuickPickGameId(supabase, gameId);
  if (gameError || !targetGameId) {
    return {
      quickPick: null as QuickPick | null,
      error: gameError ?? new Error("Unable to save your quick pick right now."),
    };
  }

  const { data, error } = await supabase
    .from("quick_picks")
    .insert({
      user_id: user.id,
      game_id: targetGameId,
      question_text: questionText,
      selected_side: selectedSide,
      pick_type: pickType,
      prompt_key: promptKey,
    })
    .select("*")
    .single();

  if (!error) {
    await touchMyPresence();
    return { quickPick: data, error: null };
  }

  if (error.code === "23505") {
    const { data: existingQuickPick, error: existingError } = await supabase
      .from("quick_picks")
      .select("*")
      .eq("user_id", user.id)
      .eq("game_id", targetGameId)
      .eq("question_text", questionText)
      .maybeSingle();

    return { quickPick: existingQuickPick, error: existingError };
  }

  return { quickPick: null as QuickPick | null, error };
}

async function resolveQuickPickGameId(
  supabase: NonNullable<ReturnType<typeof createClient>>,
  requestedGameId: string,
) {
  const { data: preferredGame } = await supabase
    .from("games")
    .select("id")
    .eq("id", requestedGameId)
    .maybeSingle();

  if (preferredGame?.id) {
    return { gameId: preferredGame.id, error: null as Error | null };
  }

  const { data: worldCupFallbackGame } = await supabase
    .from("games")
    .select("id")
    .or("league.ilike.%world cup%,sport.ilike.%soccer%")
    .in("status", ["live", "scheduled", "final"])
    .order("starts_at", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (worldCupFallbackGame?.id) {
    return { gameId: worldCupFallbackGame.id, error: null as Error | null };
  }

  const { data: anyFallbackGame } = await supabase
    .from("games")
    .select("id")
    .in("status", ["live", "scheduled", "final"])
    .order("starts_at", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (anyFallbackGame?.id) {
    return { gameId: anyFallbackGame.id, error: null as Error | null };
  }

  return {
    gameId: null,
    error: new Error("Unable to save your quick pick right now."),
  };
}
