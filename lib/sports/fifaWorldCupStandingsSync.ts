/**
 * Sync World Cup group standings and knockout bracket from FIFA's official API.
 * Source: https://api.fifa.com/api/v3/calendar/{competition}/{season}/{stage}/Standing
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/lib/supabase/types";

type AdminClient = SupabaseClient<Database>;

const FIFA_API_ROOT = "https://api.fifa.com/api/v3";
const FIFA_COMPETITION_ID = "17";
const FIFA_SEASON_ID = "285023";
const FIFA_GROUP_STAGE_ID = "289273";

const KNOCKOUT_STAGE_IDS: Record<string, string> = {
  "Round of 32": "289287",
  "Round of 16": "289288",
  "Quarter-final": "289289",
  "Semi-final": "289290",
  "Play-off for third place": "289291",
  Final: "289292",
};

const KNOCKOUT_ROUND_ORDER = [
  "Round of 32",
  "Round of 16",
  "Quarter-final",
  "Semi-final",
  "Play-off for third place",
  "Final",
] as const;

type FifaLocalized = { Locale?: string; Description?: string };

type FifaTeam = {
  Abbreviation?: string;
  IdCountry?: string;
  PictureUrl?: string;
  Name?: FifaLocalized[];
  ShortClubName?: string;
};

type FifaMatchResult = {
  IdMatch?: string;
  StartTime?: string;
  HomeTeamId?: string;
  AwayTeamId?: string;
  HomeTeamScore?: number | null;
  AwayTeamScore?: number | null;
};

type FifaStandingRow = {
  IdTeam?: string;
  IdGroup?: string;
  Group?: FifaLocalized[];
  Position?: number;
  Played?: number;
  Won?: number;
  Drawn?: number;
  Lost?: number;
  For?: number;
  Against?: number;
  GoalsDiference?: number;
  Points?: number;
  QualificationStatus?: string | null;
  MatchResults?: FifaMatchResult[];
  Team?: FifaTeam;
};

type FifaStandingResponse = {
  Results?: FifaStandingRow[];
};

type FifaMatchTeam = {
  Score?: number | null;
  IdTeam?: string;
  IdCountry?: string;
  Abbreviation?: string;
  PictureUrl?: string;
  TeamName?: FifaLocalized[];
  ShortClubName?: string;
};

type FifaMatchRow = {
  IdMatch?: string;
  Date?: string;
  StageName?: FifaLocalized[];
  Home?: FifaMatchTeam | null;
  Away?: FifaMatchTeam | null;
};

type FifaMatchesResponse = {
  Results?: FifaMatchRow[];
};

export type KnockoutBracketMatch = {
  id: string;
  round: string;
  date: string | null;
  homeTeam: string | null;
  homeCode: string | null;
  awayTeam: string | null;
  awayCode: string | null;
  homeScore: number | null;
  awayScore: number | null;
};

export type KnockoutBracketRound = {
  round: string;
  matches: KnockoutBracketMatch[];
};

export type FifaStandingsSyncSummary = {
  upserted: number;
  deletedStale: number;
  knockoutRounds: number;
  knockoutMatches: number;
  sourceUpdatedAt: string;
};

function localizedValue(entries: FifaLocalized[] | undefined, fallback = ""): string {
  if (!entries?.length) {
    return fallback;
  }

  const preferred = entries.find((entry) => entry.Locale?.startsWith("en"));
  return preferred?.Description ?? entries[0]?.Description ?? fallback;
}

function teamName(team: FifaTeam | undefined): string {
  if (!team) {
    return "TBD";
  }

  return localizedValue(team.Name, team.ShortClubName ?? team.Abbreviation ?? "TBD");
}

function teamCode(team: FifaTeam | undefined): string {
  return team?.Abbreviation ?? team?.IdCountry ?? "TBD";
}

function flagUrl(template: string | undefined): string | null {
  if (!template) {
    return null;
  }

  return template.replace("{format}", "sq").replace("{size}", "1");
}

function deriveForm(teamId: string | undefined, matchResults: FifaMatchResult[] | undefined): string[] {
  if (!teamId || !matchResults?.length) {
    return [];
  }

  const completed = matchResults
    .filter(
      (match) =>
        match.HomeTeamScore != null &&
        match.AwayTeamScore != null &&
        match.StartTime &&
        (match.HomeTeamId === teamId || match.AwayTeamId === teamId),
    )
    .sort((a, b) => String(a.StartTime).localeCompare(String(b.StartTime)));

  return completed.map((match) => {
    const isHome = match.HomeTeamId === teamId;
    const teamScore = isHome ? match.HomeTeamScore : match.AwayTeamScore;
    const oppScore = isHome ? match.AwayTeamScore : match.HomeTeamScore;

    if (teamScore == null || oppScore == null) {
      return "?";
    }

    if (teamScore > oppScore) {
      return "W";
    }

    if (teamScore < oppScore) {
      return "L";
    }

    return "D";
  });
}

async function fetchFifaJson<T>(path: string): Promise<T> {
  const response = await fetch(`${FIFA_API_ROOT}${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`FIFA API ${path} returned ${response.status}.`);
  }

  return (await response.json()) as T;
}

function parseStandingRows(rows: FifaStandingRow[], sourceUpdatedAt: string) {
  return rows.map((row) => {
    const groupName = localizedValue(row.Group, "Group");
    const code = teamCode(row.Team);

    return {
      group_name: groupName,
      rank: row.Position ?? 0,
      team_name: teamName(row.Team),
      team_code: code,
      flag_url: flagUrl(row.Team?.PictureUrl),
      played: row.Played ?? 0,
      wins: row.Won ?? 0,
      draws: row.Drawn ?? 0,
      losses: row.Lost ?? 0,
      goals_for: row.For ?? 0,
      goals_against: row.Against ?? 0,
      goal_difference: row.GoalsDiference ?? 0,
      points: row.Points ?? 0,
      form: deriveForm(row.IdTeam, row.MatchResults) as Json,
      status: row.QualificationStatus ?? null,
      source: "fifa",
      source_updated_at: sourceUpdatedAt,
    };
  });
}

function parseKnockoutMatch(match: FifaMatchRow, round: string): KnockoutBracketMatch {
  const home = match.Home ?? null;
  const away = match.Away ?? null;

  return {
    id: match.IdMatch ?? `${round}-${match.Date ?? "tbd"}`,
    round,
    date: match.Date ?? null,
    homeTeam: home ? localizedValue(home.TeamName, home.ShortClubName ?? home.Abbreviation ?? undefined) : null,
    homeCode: home?.Abbreviation ?? home?.IdCountry ?? null,
    awayTeam: away ? localizedValue(away.TeamName, away.ShortClubName ?? away.Abbreviation ?? undefined) : null,
    awayCode: away?.Abbreviation ?? away?.IdCountry ?? null,
    homeScore: home?.Score ?? null,
    awayScore: away?.Score ?? null,
  };
}

async function fetchKnockoutBracket(): Promise<KnockoutBracketRound[]> {
  const rounds: KnockoutBracketRound[] = [];

  for (const round of KNOCKOUT_ROUND_ORDER) {
    const stageId = KNOCKOUT_STAGE_IDS[round];
    const payload = await fetchFifaJson<FifaMatchesResponse>(
      `/calendar/matches?language=en&IdCompetition=${FIFA_COMPETITION_ID}&IdSeason=${FIFA_SEASON_ID}&IdStage=${stageId}&count=100`,
    );

    const matches = (payload.Results ?? []).map((match) => parseKnockoutMatch(match, round));
    if (matches.length > 0) {
      rounds.push({ round, matches });
    }
  }

  return rounds;
}

function bracketHasConfirmedMatchups(rounds: KnockoutBracketRound[]): boolean {
  return rounds.some((round) =>
    round.matches.some((match) => Boolean(match.homeTeam && match.awayTeam && match.homeTeam !== "TBD" && match.awayTeam !== "TBD")),
  );
}

export async function syncFifaWorldCupStandings(admin: AdminClient): Promise<FifaStandingsSyncSummary> {
  const sourceUpdatedAt = new Date().toISOString();

  const payload = await fetchFifaJson<FifaStandingResponse>(
    `/calendar/${FIFA_COMPETITION_ID}/${FIFA_SEASON_ID}/${FIFA_GROUP_STAGE_ID}/Standing?language=en`,
  );

  const parsedRows = parseStandingRows(payload.Results ?? [], sourceUpdatedAt);
  const knockoutRounds = await fetchKnockoutBracket();

  const { data: existingRows, error: existingError } = await admin
    .from("world_cup_standings")
    .select("id, group_name, team_code");

  if (existingError) {
    throw new Error(existingError.message);
  }

  const incomingKeys = new Set(parsedRows.map((row) => `${row.group_name}::${row.team_code}`));
  const staleIds =
    existingRows?.filter((row) => !incomingKeys.has(`${row.group_name}::${row.team_code}`)).map((row) => row.id) ?? [];

  if (parsedRows.length > 0) {
    const { error: upsertError } = await admin
      .from("world_cup_standings")
      .upsert(parsedRows, { onConflict: "group_name,team_code" });

    if (upsertError) {
      throw new Error(upsertError.message);
    }
  }

  if (staleIds.length > 0) {
    const { error: deleteError } = await admin.from("world_cup_standings").delete().in("id", staleIds);
    if (deleteError) {
      throw new Error(deleteError.message);
    }
  }

  const bracketPayload = bracketHasConfirmedMatchups(knockoutRounds) ? knockoutRounds : [];

  const { error: metaError } = await admin.from("world_cup_standings_meta").upsert(
    {
      key: "knockout_bracket",
      payload: bracketPayload as unknown as Json,
      source_updated_at: sourceUpdatedAt,
    },
    { onConflict: "key" },
  );

  if (metaError) {
    throw new Error(metaError.message);
  }

  return {
    upserted: parsedRows.length,
    deletedStale: staleIds.length,
    knockoutRounds: bracketPayload.length,
    knockoutMatches: bracketPayload.reduce((total, round) => total + round.matches.length, 0),
    sourceUpdatedAt,
  };
}
