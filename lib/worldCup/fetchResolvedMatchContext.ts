import { createAdminClient } from "@/lib/supabase/admin";
import { fetchKnockoutResolutionData } from "@/lib/worldCup/fetchKnockoutResolution";
import {
  buildResolvedMatchContext,
  type MatchFeedRow,
  type ResolvedMatchContext,
  type ResolvedMatchContextInput,
} from "@/lib/worldCup/resolvedMatch";

async function fetchWorldCupGameRows(): Promise<MatchFeedRow[]> {
  const admin = createAdminClient();
  if (!admin) {
    return [];
  }

  const { data, error } = await admin
    .from("games")
    .select("id, status, home_score, away_score, starts_at, home_team, away_team, clock, period, event_name")
    .eq("league", "World Cup");

  if (error) {
    console.error("[resolved-match] failed to load games:", error.message);
    return [];
  }

  return (data ?? []) as MatchFeedRow[];
}

export async function fetchResolvedMatchContextInput(now = new Date()): Promise<ResolvedMatchContextInput> {
  const [knockoutResolution, games] = await Promise.all([
    fetchKnockoutResolutionData(),
    fetchWorldCupGameRows(),
  ]);

  return {
    knockoutResolution,
    games,
    nowIso: now.toISOString(),
  };
}

export async function fetchResolvedMatchContext(now = new Date()): Promise<ResolvedMatchContext> {
  const input = await fetchResolvedMatchContextInput(now);
  return buildResolvedMatchContext(input);
}
