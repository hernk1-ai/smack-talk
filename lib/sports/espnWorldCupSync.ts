import type { SupabaseClient } from "@supabase/supabase-js";

import { getWorldCupMatchId, worldCupSchedule, type WorldCupMatch } from "@/data/worldCupSchedule";
import type { Database } from "@/lib/supabase/types";

type AdminClient = SupabaseClient<Database>;
type GameUpdate = Database["public"]["Tables"]["games"]["Update"];

export const ESPN_WORLD_CUP_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

/** Display lifecycle that maps to the games_status_check constraint. */
export type GameStatus = "scheduled" | "live" | "final";

// ---- ESPN payload shapes (only the fields we read) -------------------------

type EspnCompetitor = {
  homeAway?: "home" | "away";
  score?: string;
  team?: {
    displayName?: string;
    shortDisplayName?: string;
    abbreviation?: string;
  };
};

type EspnEvent = {
  id?: string;
  date?: string;
  name?: string;
  shortName?: string;
  status?: {
    type?: {
      name?: string;
      state?: string;
      completed?: boolean;
    };
  };
  competitions?: Array<{ competitors?: EspnCompetitor[] }>;
};

type EspnScoreboard = {
  events?: EspnEvent[];
};

export type EspnParsedEvent = {
  espnEventId: string;
  name: string;
  date: string | null;
  /** null = unknown ESPN status; callers must NOT update games.status in that case. */
  status: GameStatus | null;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: string | null;
  awayTeam: string | null;
};

export type EspnSyncSkip = {
  espnEventId: string;
  locktGameId?: string;
  reason: string;
};

export type EspnSyncSummary = {
  fetchedEvents: number;
  mappedEvents: number;
  updatedGames: number;
  skipped: EspnSyncSkip[];
  errors: string[];
};

export type EspnMappingProposal = {
  locktGameId: string;
  espnEventId: string;
  espnEventName: string;
  startsAt: string | null;
  locktMatch: string;
  espnMatch: string;
};

/**
 * Map an ESPN status.type.name to a Lockt game status.
 * Unknown values return null so the caller leaves games.status untouched.
 */
export function mapEspnStatus(statusName: string | undefined): GameStatus | null {
  switch (statusName) {
    case "STATUS_SCHEDULED":
      return "scheduled";
    case "STATUS_IN_PROGRESS":
    case "STATUS_HALFTIME":
      return "live";
    case "STATUS_FINAL":
      return "final";
    default:
      return null;
  }
}

function parseScore(value: string | undefined): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function teamLabel(competitor: EspnCompetitor | undefined): string | null {
  return (
    competitor?.team?.displayName ??
    competitor?.team?.shortDisplayName ??
    competitor?.team?.abbreviation ??
    null
  );
}

/** Parse a raw ESPN scoreboard payload into normalized events. */
export function parseEspnScoreboard(scoreboard: EspnScoreboard): EspnParsedEvent[] {
  const events: EspnParsedEvent[] = [];

  for (const event of scoreboard.events ?? []) {
    if (!event.id) {
      continue;
    }

    const competition = event.competitions?.[0];
    const home = competition?.competitors?.find((competitor) => competitor.homeAway === "home");
    const away = competition?.competitors?.find((competitor) => competitor.homeAway === "away");

    events.push({
      espnEventId: event.id,
      name: event.name ?? event.shortName ?? `ESPN event ${event.id}`,
      date: event.date ?? null,
      status: mapEspnStatus(event.status?.type?.name),
      homeScore: parseScore(home?.score),
      awayScore: parseScore(away?.score),
      homeTeam: teamLabel(home),
      awayTeam: teamLabel(away),
    });
  }

  return events;
}

/** Fetch + parse the ESPN FIFA World Cup scoreboard. */
export async function fetchEspnWorldCupScoreboard(): Promise<EspnParsedEvent[]> {
  const response = await fetch(ESPN_WORLD_CUP_SCOREBOARD_URL, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`ESPN World Cup scoreboard returned ${response.status}`);
  }

  const scoreboard = (await response.json()) as EspnScoreboard;
  return parseEspnScoreboard(scoreboard);
}

/**
 * Sync ESPN scores/status into the games table for every mapped event.
 * Only home_score, away_score, status and updated_at are ever written, and
 * writes are scoped to league = 'World Cup'.
 */
export async function syncEspnWorldCupScores(admin: AdminClient): Promise<EspnSyncSummary> {
  const summary: EspnSyncSummary = {
    fetchedEvents: 0,
    mappedEvents: 0,
    updatedGames: 0,
    skipped: [],
    errors: [],
  };

  let events: EspnParsedEvent[];
  try {
    events = await fetchEspnWorldCupScoreboard();
  } catch (error) {
    summary.errors.push(error instanceof Error ? error.message : "Failed to fetch ESPN scoreboard.");
    return summary;
  }
  summary.fetchedEvents = events.length;

  const { data: mappings, error: mapError } = await admin
    .from("espn_match_map")
    .select("lockt_game_id, espn_event_id");

  if (mapError) {
    summary.errors.push(`Unable to read espn_match_map: ${mapError.message}`);
    return summary;
  }

  const gameIdByEspnId = new Map((mappings ?? []).map((row) => [row.espn_event_id, row.lockt_game_id]));

  for (const event of events) {
    const locktGameId = gameIdByEspnId.get(event.espnEventId);
    if (!locktGameId) {
      summary.skipped.push({ espnEventId: event.espnEventId, reason: "No mapping for ESPN event." });
      continue;
    }

    summary.mappedEvents += 1;

    const patch: GameUpdate = { updated_at: new Date().toISOString() };
    if (event.homeScore !== null) {
      patch.home_score = event.homeScore;
    }
    if (event.awayScore !== null) {
      patch.away_score = event.awayScore;
    }
    if (event.status !== null) {
      patch.status = event.status;
    }

    const hasMeaningfulUpdate =
      patch.home_score !== undefined || patch.away_score !== undefined || patch.status !== undefined;

    if (!hasMeaningfulUpdate) {
      summary.skipped.push({
        espnEventId: event.espnEventId,
        locktGameId,
        reason: "No parseable score or status from ESPN.",
      });
      continue;
    }

    const { data, error } = await admin
      .from("games")
      .update(patch)
      .eq("id", locktGameId)
      .eq("league", "World Cup")
      .select("id")
      .maybeSingle();

    if (error) {
      summary.errors.push(`${locktGameId}: ${error.message}`);
      continue;
    }

    if (!data) {
      summary.skipped.push({
        espnEventId: event.espnEventId,
        locktGameId,
        reason: "No matching World Cup games row.",
      });
      continue;
    }

    summary.updatedGames += 1;
  }

  return summary;
}

// ---- Optional mapping helper (dry-run; never writes) -----------------------

function normalizeTeamName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
}

/** Heuristic: do two team names refer to the same side? Best-effort only. */
function teamsMatch(a: string, b: string): boolean {
  const x = normalizeTeamName(a);
  const y = normalizeTeamName(b);
  if (!x || !y) return false;
  return x === y || x.includes(y) || y.includes(x);
}

/**
 * Propose espn_match_map rows by matching ESPN events to the static schedule on
 * kickoff date + both team names. Returns suggestions only — it never writes.
 * Manual review / SQL insert is expected before trusting these.
 */
export function proposeEspnMatchMappings(
  events: EspnParsedEvent[],
  schedule: WorldCupMatch[] = worldCupSchedule,
): EspnMappingProposal[] {
  const proposals: EspnMappingProposal[] = [];

  for (const event of events) {
    if (!event.homeTeam || !event.awayTeam || !event.date) {
      continue;
    }
    const espnDay = event.date.slice(0, 10);

    const match = schedule.find((candidate) => {
      if (candidate.date !== espnDay) return false;
      const home = candidate.homeTeam;
      const away = candidate.awayTeam;
      if (!home || !away) return false;
      const direct = teamsMatch(home, event.homeTeam!) && teamsMatch(away, event.awayTeam!);
      const swapped = teamsMatch(home, event.awayTeam!) && teamsMatch(away, event.homeTeam!);
      return direct || swapped;
    });

    if (!match) {
      continue;
    }

    proposals.push({
      locktGameId: getWorldCupMatchId(match),
      espnEventId: event.espnEventId,
      espnEventName: event.name,
      startsAt: event.date,
      locktMatch: `${match.homeTeam} vs ${match.awayTeam ?? "TBD"}`,
      espnMatch: `${event.homeTeam} vs ${event.awayTeam}`,
    });
  }

  return proposals;
}
