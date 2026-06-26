import type { Database } from "@/lib/supabase/types";
import type { KnockoutBracketRound } from "@/lib/sports/fifaWorldCupStandingsSync";

export type WorldCupStandingRow = Database["public"]["Tables"]["world_cup_standings"]["Row"];

export type StandingsPageData = {
  groups: Record<string, WorldCupStandingRow[]>;
  thirdPlace: WorldCupStandingRow[];
  knockoutBracket: KnockoutBracketRound[];
  lastUpdated: string | null;
  isEmpty: boolean;
};

export function formatStandingsForm(form: WorldCupStandingRow["form"]): string {
  if (!Array.isArray(form)) {
    return "—";
  }

  const letters = form.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
  return letters.length > 0 ? letters.join("") : "—";
}
