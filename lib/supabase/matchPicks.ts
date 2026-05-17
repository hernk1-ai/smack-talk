import { getWorldCupKickoffIso, getWorldCupMatchId, isWorldCupMatchLocked, type WorldCupMatch } from "@/data/worldCupSchedule";
import { createClient } from "@/lib/supabase/client";
import type { MatchPick } from "@/lib/supabase/types";

type LockWinnerInput = {
  match: WorldCupMatch;
  selectedWinner: string;
};

type LockExactScoreInput = {
  match: WorldCupMatch;
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

export async function lockCurrentUserWinnerPick({ match, selectedWinner }: LockWinnerInput) {
  const base = await getWritableContext(match);
  if (base.error || !base.supabase || !base.userId || !base.kickoffIso) {
    return { pick: null as MatchPick | null, error: base.error };
  }

  const { existingPick } = base;
  if (existingPick?.winner_locked_at) {
    return { pick: existingPick, error: new Error("Locked, no take backs.") };
  }

  if (!selectedWinner.trim()) {
    return { pick: null as MatchPick | null, error: new Error("Choose a winner before locking.") };
  }

  const payload = getBasePayload(match, base.userId, base.kickoffIso, existingPick);
  const { data, error } = await base.supabase
    .from("match_picks")
    .upsert(
      {
        ...payload,
        selected_winner: selectedWinner,
        winner_locked_at: new Date().toISOString(),
      },
      { onConflict: "user_id,match_id" },
    )
    .select("*")
    .single();

  return { pick: data, error: normalizeWritableError(error) };
}

export async function lockCurrentUserExactScorePick({ match, homeScore, awayScore }: LockExactScoreInput) {
  const base = await getWritableContext(match);
  if (base.error || !base.supabase || !base.userId || !base.kickoffIso) {
    return { pick: null as MatchPick | null, error: base.error };
  }

  const { existingPick } = base;
  if (existingPick?.exact_score_locked_at) {
    return { pick: existingPick, error: new Error("Locked, no take backs.") };
  }

  if (!Number.isFinite(homeScore) || homeScore < 0 || !Number.isFinite(awayScore) || awayScore < 0) {
    return { pick: null as MatchPick | null, error: new Error("Enter valid score predictions.") };
  }

  const payload = getBasePayload(match, base.userId, base.kickoffIso, existingPick);
  const { data, error } = await base.supabase
    .from("match_picks")
    .upsert(
      {
        ...payload,
        home_score: homeScore,
        away_score: awayScore,
        exact_score_locked_at: new Date().toISOString(),
      },
      { onConflict: "user_id,match_id" },
    )
    .select("*")
    .single();

  return { pick: data, error: normalizeWritableError(error) };
}

async function getWritableContext(match: WorldCupMatch) {
  const supabase = createClient();
  if (!supabase) {
    return { supabase: null, userId: null, kickoffIso: null, existingPick: null as MatchPick | null, error: new Error("Supabase is not configured.") };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { supabase: null, userId: null, kickoffIso: null, existingPick: null as MatchPick | null, error: userError };
  }
  if (!user) {
    return { supabase: null, userId: null, kickoffIso: null, existingPick: null as MatchPick | null, error: new Error("Please sign in to make a call.") };
  }
  if (isWorldCupMatchLocked(match)) {
    return { supabase: null, userId: null, kickoffIso: null, existingPick: null as MatchPick | null, error: new Error("This match is already locked.") };
  }

  const kickoffIso = getWorldCupKickoffIso(match);
  if (!kickoffIso) {
    return { supabase: null, userId: null, kickoffIso: null, existingPick: null as MatchPick | null, error: new Error("Unable to save your pick right now.") };
  }

  const { data: existingPick, error } = await supabase
    .from("match_picks")
    .select("*")
    .eq("user_id", user.id)
    .eq("match_id", getWorldCupMatchId(match))
    .maybeSingle();

  if (error) {
    return { supabase: null, userId: null, kickoffIso: null, existingPick: null as MatchPick | null, error: normalizeMatchPicksError(error) };
  }

  return { supabase, userId: user.id, kickoffIso, existingPick, error: null as Error | null };
}

function getBasePayload(match: WorldCupMatch, userId: string, kickoffIso: string, existingPick: MatchPick | null) {
  return {
    user_id: userId,
    match_id: getWorldCupMatchId(match),
    match_number: match.id,
    stage: match.stage,
    home_team: match.homeTeam,
    away_team: match.awayTeam ?? "TBD",
    selected_winner: existingPick?.selected_winner ?? null,
    home_score: existingPick?.home_score ?? null,
    away_score: existingPick?.away_score ?? null,
    kickoff_at: kickoffIso,
    status: existingPick?.status ?? ("locked" as const),
    winner_locked_at: existingPick?.winner_locked_at ?? null,
    exact_score_locked_at: existingPick?.exact_score_locked_at ?? null,
    winner_result: existingPick?.winner_result ?? ("pending" as const),
    exact_score_result: existingPick?.exact_score_result ?? ("pending" as const),
    winner_rep_delta: existingPick?.winner_rep_delta ?? 0,
    exact_score_rep_delta: existingPick?.exact_score_rep_delta ?? 0,
  };
}

function normalizeWritableError(error: { code?: string | null; message?: string | null } | null) {
  if (error?.code === "42501") {
    return new Error("Locked, no take backs.");
  }

  return normalizeMatchPicksError(error);
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
