import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  fetchStandingsGroupTables,
  fetchStandingsKnockoutBracket,
  type KnockoutBracketRound,
} from "@/lib/sports/fifaWorldCupStandingsSync";
import { worldCupGroupOrder } from "@/data/worldCupGroups";
import type { StandingsPageData, WorldCupStandingRow } from "@/lib/worldCup/standingsTypes";

export type { StandingsPageData, WorldCupStandingRow } from "@/lib/worldCup/standingsTypes";
export { formatStandingsForm } from "@/lib/worldCup/standingsTypes";

function sortThirdPlaceRows(rows: WorldCupStandingRow[]): WorldCupStandingRow[] {
  return [...rows].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    if (b.goal_difference !== a.goal_difference) {
      return b.goal_difference - a.goal_difference;
    }

    if (b.goals_for !== a.goals_for) {
      return b.goals_for - a.goals_for;
    }

    return a.team_name.localeCompare(b.team_name);
  });
}

function groupStandingsByName(rows: WorldCupStandingRow[]): Record<string, WorldCupStandingRow[]> {
  const grouped: Record<string, WorldCupStandingRow[]> = {};

  for (const groupName of worldCupGroupOrder) {
    grouped[groupName] = [];
  }

  for (const row of rows) {
    if (!grouped[row.group_name]) {
      grouped[row.group_name] = [];
    }

    grouped[row.group_name].push(row);
  }

  for (const groupName of Object.keys(grouped)) {
    grouped[groupName].sort((a, b) => a.rank - b.rank);
  }

  return grouped;
}

function parseKnockoutBracket(payload: unknown): KnockoutBracketRound[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload as KnockoutBracketRound[];
}

export async function fetchWorldCupStandingsPageData(): Promise<StandingsPageData> {
  const admin = createAdminClient();
  const supabase = admin ?? (await createClient());

  if (!supabase) {
    return {
      groups: groupStandingsByName([]),
      thirdPlace: [],
      knockoutBracket: [],
      lastUpdated: null,
      isEmpty: true,
    };
  }

  const [{ data: standings, error: standingsError }, { data: meta, error: metaError }] = await Promise.all([
    supabase.from("world_cup_standings").select("*").order("group_name").order("rank"),
    supabase.from("world_cup_standings_meta").select("payload, source_updated_at").eq("key", "knockout_bracket").maybeSingle(),
  ]);

  if (standingsError) {
    console.error("[standings] failed to load standings rows:", standingsError.message);
  }

  if (metaError) {
    console.error("[standings] failed to load knockout bracket meta:", metaError.message);
  }

  const cachedRows = (standings ?? []) as WorldCupStandingRow[];
  const [rows, knockoutBracket] = await Promise.all([
    fetchStandingsGroupTables(cachedRows),
    fetchStandingsKnockoutBracket(parseKnockoutBracket(meta?.payload)),
  ]);
  const thirdPlace = sortThirdPlaceRows(rows.filter((row) => row.rank === 3));
  const lastUpdated =
    rows.reduce<string | null>((latest, row) => {
      if (!row.source_updated_at) {
        return latest;
      }

      if (!latest || row.source_updated_at > latest) {
        return row.source_updated_at;
      }

      return latest;
    }, null) ?? meta?.source_updated_at ?? null;

  return {
    groups: groupStandingsByName(rows),
    thirdPlace,
    knockoutBracket,
    lastUpdated,
    isEmpty: rows.length === 0,
  };
}
