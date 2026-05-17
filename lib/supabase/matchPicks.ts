import { getWorldCupKickoffIso, getWorldCupMatchId, isWorldCupMatchLocked, type WorldCupMatch } from "@/data/worldCupSchedule";
import { createClient } from "@/lib/supabase/client";
import type { MatchPick } from "@/lib/supabase/types";

type SaveMatchPickInput = {
  match: WorldCupMatch;
  selectedWinner: string;
  homeScore: number;
  awayScore: number;
};

export async function getCurrentUserMatchPick(match: WorldCupMatch) {
  const supabase = createClient();

  if (!supabase) {
    return { pick: null as MatchPick | null, error: new Error("Supabase is not configured.") };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { pick: null, error: userError };
  }

  if (!user) {
    return { pick: null, error: new Error("Please sign in to make a call.") };
  }

  const { data, error } = await supabase
    .from("match_picks")
    .select("*")
    .eq("user_id", user.id)
    .eq("match_id", getWorldCupMatchId(match))
    .maybeSingle();

  return { pick: data, error: normalizeMatchPicksError(error) };
}

export async function getCurrentUserMatchPicks() {
  const supabase = createClient();

  if (!supabase) {
    return { picks: [] as MatchPick[], error: new Error("Supabase is not configured.") };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { picks: [] as MatchPick[], error: userError };
  }

  if (!user) {
    return { picks: [] as MatchPick[], error: new Error("Please sign in to view your match picks.") };
  }

  const { data, error } = await supabase
    .from("match_picks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return { picks: data ?? [], error: normalizeMatchPicksError(error) };
}

export async function saveCurrentUserMatchPick({ match, selectedWinner, homeScore, awayScore }: SaveMatchPickInput) {
  const supabase = createClient();

  if (!supabase) {
    return { pick: null as MatchPick | null, error: new Error("Supabase is not configured.") };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { pick: null, error: userError };
  }

  if (!user) {
    return { pick: null, error: new Error("Please sign in to make a call.") };
  }

  if (isWorldCupMatchLocked(match)) {
    return { pick: null, error: new Error("This match is already locked.") };
  }

  const kickoffIso = getWorldCupKickoffIso(match);
  if (!kickoffIso) {
    return { pick: null, error: new Error("Unable to save your pick right now.") };
  }

  const payload = {
    user_id: user.id,
    match_id: getWorldCupMatchId(match),
    match_number: match.id,
    stage: match.stage,
    home_team: match.homeTeam,
    away_team: match.awayTeam ?? "TBD",
    selected_winner: selectedWinner,
    home_score: homeScore,
    away_score: awayScore,
    kickoff_at: kickoffIso,
    status: "locked" as const,
  };

  const { data, error } = await supabase
    .from("match_picks")
    .upsert(payload, { onConflict: "user_id,match_id" })
    .select("*")
    .single();

  const normalizedError = normalizeMatchPicksError(error);

  if (error?.code === "42501") {
    return { pick: null, error: new Error("This match is already locked.") };
  }

  return { pick: data, error: normalizedError };
}

function normalizeMatchPicksError(error: { code?: string | null; message?: string | null } | null) {
  if (!error) {
    return null;
  }

  if (error.code === "PGRST205" || (error.message ?? "").includes("public.match_picks")) {
    return new Error("Match picks are not set up yet. Please run the latest database migration.");
  }

  return error as Error;
}
