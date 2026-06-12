import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getWorldCupKickoffIso,
  getWorldCupMatchId,
  worldCupSchedule,
  type WorldCupMatch,
} from "@/data/worldCupSchedule";
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

/**
 * Fetch + parse the ESPN FIFA World Cup scoreboard. Pass a `YYYYMMDD` date to
 * query a specific day; omit it for ESPN's default (current) scoreboard, which
 * is what the live sync uses.
 */
export async function fetchEspnWorldCupScoreboard(date?: string): Promise<EspnParsedEvent[]> {
  const url = new URL(ESPN_WORLD_CUP_SCOREBOARD_URL);
  if (date) {
    url.searchParams.set("dates", date);
  }

  const response = await fetch(url, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`ESPN World Cup scoreboard returned ${response.status}`);
  }

  const scoreboard = (await response.json()) as EspnScoreboard;
  return parseEspnScoreboard(scoreboard);
}

/** Convert a schedule date (`YYYY-MM-DD`) to ESPN's `YYYYMMDD` query format. */
function toEspnDateParam(date: string): string {
  return date.replace(/-/g, "");
}

/** Distinct upcoming match calendar dates from the static schedule. */
export function upcomingScheduleDates(now: Date = new Date(), maxDates = 14): string[] {
  const dates: string[] = [];
  const seen = new Set<string>();

  for (const match of worldCupSchedule) {
    const iso = getWorldCupKickoffIso(match);
    if (!iso || new Date(iso).getTime() < now.getTime()) {
      continue;
    }
    if (!seen.has(match.date)) {
      seen.add(match.date);
      dates.push(match.date);
    }
    if (dates.length >= maxDates) {
      break;
    }
  }

  return dates;
}

/**
 * Fetch ESPN events across a set of schedule dates (`YYYY-MM-DD`), deduped by
 * event id. ESPN reports kickoffs in UTC, so adjacent days are also pulled to
 * catch late-night ET matches that roll into the next UTC day.
 */
export async function fetchEspnWorldCupEventsForDates(dates: string[]): Promise<EspnParsedEvent[]> {
  const dayParams = new Set<string>();
  for (const date of dates) {
    dayParams.add(toEspnDateParam(date));
    // Late ET kickoffs land on the next UTC day; include it so they appear.
    const next = new Date(`${date}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    dayParams.add(next.toISOString().slice(0, 10).replace(/-/g, ""));
  }

  const byId = new Map<string, EspnParsedEvent>();
  for (const day of dayParams) {
    const events = await fetchEspnWorldCupScoreboard(day);
    for (const event of events) {
      byId.set(event.espnEventId, event);
    }
  }

  return [...byId.values()];
}

/**
 * Sync ESPN scores/status into the games table for every mapped event.
 *
 * NEVER creates rows: it only issues UPDATEs scoped by id + league = 'World Cup'
 * (no insert/upsert). The games table is seeded as the source of truth from the
 * canonical FIFA schedule; if a mapped row does not exist yet, the event is
 * skipped rather than created. Only home_score, away_score, status and
 * updated_at are ever written.
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

/** Two kickoffs are considered the same match window within this tolerance. */
const KICKOFF_TOLERANCE_MS = 3 * 60 * 60 * 1000;

/** FIFA-vs-ESPN naming differences that token overlap alone cannot bridge. */
const TEAM_ALIASES: Record<string, string> = {
  turkiye: "turkey",
  cotedivoire: "ivorycoast",
  czechrepublic: "czechia",
  korearepublic: "southkorea",
  irislamicrepubliciran: "iran",
  iriran: "iran",
};

const TEAM_STOPWORDS = new Set(["and", "of", "the", "republic", "rep", "ir", "fr"]);

/** Tokenize a team name into comparable parts, applying known aliases. */
function teamTokens(value: string): Set<string> {
  const cleaned = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const tokens = cleaned.split(/[^a-z]+/).filter(Boolean);
  const joined = tokens.join("");
  if (TEAM_ALIASES[joined]) {
    return new Set([TEAM_ALIASES[joined]]);
  }
  const meaningful = tokens.filter((token) => !TEAM_STOPWORDS.has(token));
  return new Set(meaningful.length > 0 ? meaningful : tokens);
}

/** Heuristic: do two team names refer to the same side? Best-effort only. */
function teamsMatch(a: string, b: string): boolean {
  const ta = teamTokens(a);
  const tb = teamTokens(b);
  if (ta.size === 0 || tb.size === 0) return false;
  for (const token of ta) {
    if (tb.has(token)) return true;
  }
  const ja = [...ta].join("");
  const jb = [...tb].join("");
  return ja === jb || ja.includes(jb) || jb.includes(ja);
}

/**
 * Propose espn_match_map rows by matching ESPN events to the static schedule on
 * kickoff instant (UTC-safe, within a tolerance) plus both team names. Returns
 * suggestions only — it never writes. Manual review / SQL insert is expected
 * before trusting these.
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
    const espnTime = new Date(event.date).getTime();
    if (!Number.isFinite(espnTime)) {
      continue;
    }

    const match = schedule.find((candidate) => {
      const home = candidate.homeTeam;
      const away = candidate.awayTeam;
      if (!home || !away) return false;

      const iso = getWorldCupKickoffIso(candidate);
      if (!iso) return false;
      if (Math.abs(new Date(iso).getTime() - espnTime) > KICKOFF_TOLERANCE_MS) return false;

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
