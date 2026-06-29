import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { KnockoutBracketRound } from "@/lib/sports/fifaWorldCupStandingsSync";
import type { KnockoutResolutionData } from "@/lib/worldCup/knockoutMatchResolver";
import type { WorldCupStandingRow } from "@/lib/worldCup/standingsTypes";

const EMPTY_KNOCKOUT_RESOLUTION: KnockoutResolutionData = {
  standings: [],
  bracket: [],
};

function parseKnockoutBracket(payload: unknown): KnockoutBracketRound[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload as KnockoutBracketRound[];
}

export async function fetchKnockoutResolutionData(): Promise<KnockoutResolutionData> {
  const admin = createAdminClient();
  const supabase = admin ?? (await createClient());

  if (!supabase) {
    return EMPTY_KNOCKOUT_RESOLUTION;
  }

  const [{ data: standings, error: standingsError }, { data: meta, error: metaError }] = await Promise.all([
    supabase.from("world_cup_standings").select("group_name, rank, team_name, status").order("group_name").order("rank"),
    supabase.from("world_cup_standings_meta").select("payload").eq("key", "knockout_bracket").maybeSingle(),
  ]);

  if (standingsError) {
    console.error("[knockout-resolution] failed to load standings:", standingsError.message);
  }

  if (metaError) {
    console.error("[knockout-resolution] failed to load bracket meta:", metaError.message);
  }

  const rows = (standings ?? []) as Pick<WorldCupStandingRow, "group_name" | "rank" | "team_name" | "status">[];

  return {
    standings: rows,
    bracket: parseKnockoutBracket(meta?.payload),
  };
}
