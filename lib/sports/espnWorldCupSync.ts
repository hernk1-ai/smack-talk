import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getWorldCupKickoffIso,
  getWorldCupMatchId,
  worldCupSchedule,
  type WorldCupMatch,
} from "@/data/worldCupSchedule";
import { applyStaleLiveFinalFallback, normalizeFeedGameStatus } from "@/lib/worldCup/gameStatus";
import { fetchKnockoutResolutionData } from "@/lib/worldCup/fetchKnockoutResolution";
import { buildResolvedMatchContext, resolveMatch } from "@/lib/worldCup/resolvedMatch";
import type { KnockoutResolutionData } from "@/lib/worldCup/knockoutMatchResolver";
import { shouldApplyEspnScorePatch, shouldApplyEspnStatusPatch } from "@/lib/worldCup/matchSelection";
import { parseWorldCupRouteGameId } from "@/lib/supabase/resolveArenaGame";
import { teamsMatch } from "@/lib/sports/espnTeamNames";
import {
  buildAlignedScorePatch,
  getEspnTeamAlignment,
} from "@/lib/sports/espnTeamAlignment";
import type { Database } from "@/lib/supabase/types";

type AdminClient = SupabaseClient<Database>;
type GameUpdate = Database["public"]["Tables"]["games"]["Update"];
type WorldCupGameRow = Pick<
  Database["public"]["Tables"]["games"]["Row"],
  "id" | "home_team" | "away_team" | "starts_at" | "status"
>;
type WorldCupGameWithScores = WorldCupGameRow &
  Pick<Database["public"]["Tables"]["games"]["Row"], "home_score" | "away_score">;
type EspnMatchMapRow = Database["public"]["Tables"]["espn_match_map"]["Row"];

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
  autoMapped: EspnAutoMapResult[];
};

export type EspnAutoMapResult = {
  locktGameId: string;
  match: string;
  espnEventId?: string;
  status: "mapped" | "ambiguous" | "failed" | "skipped_existing";
  reason?: string;
};

export type EspnAutoMapReport = {
  scannedGames: number;
  fetchedEvents: number;
  results: EspnAutoMapResult[];
  errors: string[];
};

export type EspnTeamAlignResult = {
  locktGameId: string;
  match: string;
  espnEventId?: string;
  status: "aligned" | "swapped" | "unchanged" | "failed" | "skipped";
  reason: string;
};

export type EspnTeamAlignReport = {
  scannedMappings: number;
  fetchedEvents: number;
  results: EspnTeamAlignResult[];
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
 * Map ESPN status fields to a Lockt game status.
 * Soccer finals use STATUS_FULL_TIME; `state`/`completed` mirror the NBA normalizer.
 * Unknown values return null so the caller leaves games.status untouched.
 */
export function mapEspnStatus(
  statusName: string | undefined,
  state?: string,
  completed?: boolean,
): GameStatus | null {
  if (completed || state === "post") {
    return "final";
  }

  if (state === "in") {
    return "live";
  }

  switch (statusName) {
    case "STATUS_SCHEDULED":
      return "scheduled";
    case "STATUS_IN_PROGRESS":
    case "STATUS_HALFTIME":
    case "STATUS_FIRST_HALF":
    case "STATUS_SECOND_HALF":
      return "live";
    case "STATUS_FINAL":
    case "STATUS_FULL_TIME":
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
      status: mapEspnStatus(
        event.status?.type?.name,
        event.status?.type?.state,
        event.status?.type?.completed,
      ),
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

/** Two kickoffs are considered the same match window within this tolerance. */
export const ESPN_KICKOFF_TOLERANCE_MS = 6 * 60 * 60 * 1000;

const WORLD_CUP_SCHEDULE_TIME_ZONE = "America/New_York";

/** A game is live, recently finished, or within the auto-map kickoff window. */
export function isNearLiveWorldCupGame(game: WorldCupGameRow, now = new Date()): boolean {
  if (game.status === "live") {
    return true;
  }

  if (!game.starts_at) {
    return false;
  }

  const kickoffMs = new Date(game.starts_at).getTime();
  if (!Number.isFinite(kickoffMs)) {
    return false;
  }

  const elapsedMs = now.getTime() - kickoffMs;

  if (game.status === "final" && elapsedMs >= 0 && elapsedMs <= 24 * 60 * 60 * 1000) {
    return true;
  }

  return Math.abs(kickoffMs - now.getTime()) <= ESPN_KICKOFF_TOLERANCE_MS;
}

function getLocalDateKey(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function getTodayLocalDateKey(now = new Date(), timeZone = WORLD_CUP_SCHEDULE_TIME_ZONE): string {
  return getLocalDateKey(now.toISOString(), timeZone);
}

function isGameOnLocalDate(game: WorldCupGameRow, dateKey: string, timeZone = WORLD_CUP_SCHEDULE_TIME_ZONE): boolean {
  if (!game.starts_at) {
    return false;
  }

  return getLocalDateKey(game.starts_at, timeZone) === dateKey;
}

function mergeEspnEventsById(...groups: EspnParsedEvent[][]): EspnParsedEvent[] {
  const byId = new Map<string, EspnParsedEvent>();
  for (const group of groups) {
    for (const event of group) {
      byId.set(event.espnEventId, event);
    }
  }

  return [...byId.values()];
}

/** Does an ESPN event match a Lockt game on teams + kickoff window? */
export function gameMatchesEspnEvent(
  game: Pick<WorldCupGameRow, "home_team" | "away_team" | "starts_at">,
  event: EspnParsedEvent,
  toleranceMs = ESPN_KICKOFF_TOLERANCE_MS,
): boolean {
  if (!event.homeTeam || !event.awayTeam || !event.date || !game.starts_at) {
    return false;
  }

  const gameTime = new Date(game.starts_at).getTime();
  const espnTime = new Date(event.date).getTime();
  if (!Number.isFinite(gameTime) || !Number.isFinite(espnTime)) {
    return false;
  }

  if (Math.abs(gameTime - espnTime) > toleranceMs) {
    return false;
  }

  const direct =
    teamsMatch(game.home_team, event.homeTeam) && teamsMatch(game.away_team, event.awayTeam);
  const swapped =
    teamsMatch(game.home_team, event.awayTeam) && teamsMatch(game.away_team, event.homeTeam);

  return direct || swapped;
}

function buildGameMatchingProfiles(
  game: WorldCupGameRow,
  knockoutResolution?: KnockoutResolutionData | null,
): Array<Pick<WorldCupGameRow, "home_team" | "away_team" | "starts_at">> {
  const profiles: Array<Pick<WorldCupGameRow, "home_team" | "away_team" | "starts_at">> = [
    { home_team: game.home_team, away_team: game.away_team, starts_at: game.starts_at },
  ];

  const parsed = parseWorldCupRouteGameId(game.id);
  if (!parsed) {
    return profiles;
  }

  const resolved = resolveMatch(
    parsed.worldCupMatch,
    buildResolvedMatchContext({ knockoutResolution: knockoutResolution ?? { standings: [], bracket: [] } }),
  );
  const resolvedProfile = {
    home_team: resolved.home.name,
    away_team: resolved.away.name,
    starts_at: game.starts_at ?? getWorldCupKickoffIso(parsed.worldCupMatch),
  };

  const alreadyPresent = profiles.some(
    (profile) =>
      profile.home_team === resolvedProfile.home_team && profile.away_team === resolvedProfile.away_team,
  );

  if (!alreadyPresent) {
    profiles.push(resolvedProfile);
  }

  return profiles;
}

export function findEspnEventsForGame(
  game: WorldCupGameRow,
  events: EspnParsedEvent[],
  knockoutResolution?: KnockoutResolutionData | null,
): EspnParsedEvent[] {
  const matched: EspnParsedEvent[] = [];

  for (const profile of buildGameMatchingProfiles(game, knockoutResolution)) {
    for (const event of events) {
      if (gameMatchesEspnEvent(profile, event)) {
        matched.push(event);
      }
    }

    if (matched.length) {
      break;
    }
  }

  return [...new Map(matched.map((event) => [event.espnEventId, event])).values()];
}

function formatGameMatchLabel(game: WorldCupGameRow): string {
  return `${game.home_team} vs ${game.away_team}`;
}

async function loadEspnMatchMappings(admin: AdminClient) {
  const { data, error } = await admin.from("espn_match_map").select("*");

  if (error) {
    return { mappings: null as EspnMatchMapRow[] | null, error: error.message };
  }

  return { mappings: data ?? [], error: null };
}

async function insertEspnMatchMapping(
  admin: AdminClient,
  {
    locktGameId,
    espnEventId,
    espnEventName,
    startsAt,
  }: {
    locktGameId: string;
    espnEventId: string;
    espnEventName: string;
    startsAt: string | null;
  },
) {
  const { data, error } = await admin
    .from("espn_match_map")
    .insert({
      lockt_game_id: locktGameId,
      espn_event_id: espnEventId,
      espn_event_name: espnEventName,
      starts_at: startsAt,
    })
    .select("*")
    .single();

  if (error) {
    return { mapping: null as EspnMatchMapRow | null, error: error.message };
  }

  return { mapping: data, error: null };
}

function collectEspnDatesForGames(games: WorldCupGameRow[], now = new Date()): string[] {
  const dates = new Set<string>();

  for (const game of games) {
    if (game.starts_at) {
      dates.add(getLocalDateKey(game.starts_at, WORLD_CUP_SCHEDULE_TIME_ZONE));
    }
  }

  const todayKey = getTodayLocalDateKey(now, WORLD_CUP_SCHEDULE_TIME_ZONE);
  dates.add(todayKey);

  return [...dates];
}

async function autoDiscoverEspnMappingsForGames(
  admin: AdminClient,
  games: WorldCupGameRow[],
  mappings: EspnMatchMapRow[],
  events: EspnParsedEvent[],
  knockoutResolution?: KnockoutResolutionData | null,
): Promise<{ results: EspnAutoMapResult[]; mappings: EspnMatchMapRow[]; errors: string[] }> {
  const results: EspnAutoMapResult[] = [];
  const errors: string[] = [];
  const mappingByGameId = new Map(mappings.map((row) => [row.lockt_game_id, row]));
  const mappingByEspnId = new Map(mappings.map((row) => [row.espn_event_id, row]));

  for (const game of games) {
    if (mappingByGameId.has(game.id)) {
      results.push({
        locktGameId: game.id,
        match: formatGameMatchLabel(game),
        status: "skipped_existing",
        reason: "Mapping already exists.",
      });
      continue;
    }

    const matches = findEspnEventsForGame(game, events, knockoutResolution);
    if (matches.length === 0) {
      results.push({
        locktGameId: game.id,
        match: formatGameMatchLabel(game),
        status: "failed",
        reason: "No ESPN event matched teams and kickoff window.",
      });
      continue;
    }

    if (matches.length > 1) {
      results.push({
        locktGameId: game.id,
        match: formatGameMatchLabel(game),
        status: "ambiguous",
        reason: `Multiple ESPN events matched (${matches.map((event) => event.espnEventId).join(", ")}).`,
      });
      continue;
    }

    const event = matches[0];
    const existingEspnMapping = mappingByEspnId.get(event.espnEventId);
    if (existingEspnMapping && existingEspnMapping.lockt_game_id !== game.id) {
      results.push({
        locktGameId: game.id,
        match: formatGameMatchLabel(game),
        status: "ambiguous",
        reason: `ESPN event ${event.espnEventId} is already mapped to ${existingEspnMapping.lockt_game_id}.`,
      });
      continue;
    }

    const { mapping, error } = await insertEspnMatchMapping(admin, {
      locktGameId: game.id,
      espnEventId: event.espnEventId,
      espnEventName: event.name,
      startsAt: event.date,
    });

    if (error || !mapping) {
      errors.push(`${game.id}: ${error ?? "Unable to insert mapping."}`);
      results.push({
        locktGameId: game.id,
        match: formatGameMatchLabel(game),
        status: "failed",
        reason: error ?? "Unable to insert mapping.",
      });
      continue;
    }

    mappingByGameId.set(game.id, mapping);
    mappingByEspnId.set(event.espnEventId, mapping);
    results.push({
      locktGameId: game.id,
      match: formatGameMatchLabel(game),
      espnEventId: event.espnEventId,
      status: "mapped",
      reason: `Auto-created mapping for ESPN event ${event.espnEventId}.`,
    });
  }

  return { results, mappings: [...mappingByGameId.values()], errors };
}

async function getWorldCupGames(admin: AdminClient) {
  const { data, error } = await admin
    .from("games")
    .select("id, home_team, away_team, starts_at, status")
    .eq("league", "World Cup");

  if (error) {
    return { games: null as WorldCupGameRow[] | null, error: error.message };
  }

  return { games: data ?? [], error: null };
}

/**
 * Auto-map today's World Cup games from the games table to ESPN events.
 * Persists new rows in espn_match_map; never overwrites existing mappings.
 */
export async function autoMapTodaysWorldCupGames(
  admin: AdminClient,
  now = new Date(),
): Promise<EspnAutoMapReport> {
  const report: EspnAutoMapReport = {
    scannedGames: 0,
    fetchedEvents: 0,
    results: [],
    errors: [],
  };

  const { games, error: gamesError } = await getWorldCupGames(admin);
  if (gamesError || !games) {
    report.errors.push(gamesError ?? "Unable to load World Cup games.");
    return report;
  }

  const todayKey = getTodayLocalDateKey(now, WORLD_CUP_SCHEDULE_TIME_ZONE);
  const todaysGames = games.filter((game) => isGameOnLocalDate(game, todayKey));
  report.scannedGames = todaysGames.length;

  if (!todaysGames.length) {
    return report;
  }

  const { mappings, error: mapError } = await loadEspnMatchMappings(admin);
  if (mapError || !mappings) {
    report.errors.push(mapError ?? "Unable to read espn_match_map.");
    return report;
  }

  let events: EspnParsedEvent[];
  try {
    events = await fetchEspnWorldCupEventsForDates([todayKey]);
    report.fetchedEvents = events.length;
  } catch (error) {
    report.errors.push(error instanceof Error ? error.message : "Failed to fetch ESPN scoreboard.");
    return report;
  }

  const knockoutResolution = await fetchKnockoutResolutionData();

  const { results, errors } = await autoDiscoverEspnMappingsForGames(
    admin,
    todaysGames,
    mappings,
    events,
    knockoutResolution,
  );

  report.results = results;
  report.errors.push(...errors);
  return report;
}

async function swapRootingVotesForGame(admin: AdminClient, gameId: string) {
  const { data: votes, error } = await admin
    .from("match_rooting_votes")
    .select("id, team_key")
    .eq("game_id", gameId);

  if (error) {
    return { error: error.message, swapped: 0 };
  }

  let swapped = 0;
  for (const vote of votes ?? []) {
    if (vote.team_key !== "home" && vote.team_key !== "away") {
      continue;
    }

    const nextKey = vote.team_key === "home" ? "away" : "home";
    const { error: updateError } = await admin
      .from("match_rooting_votes")
      .update({ team_key: nextKey })
      .eq("id", vote.id);

    if (updateError) {
      return { error: updateError.message, swapped };
    }

    swapped += 1;
  }

  return { error: null, swapped };
}

async function syncMatchPickTeamsForGame(
  admin: AdminClient,
  gameId: string,
  homeTeam: string,
  awayTeam: string,
  swapped: boolean,
) {
  const { data: picks, error } = await admin
    .from("match_picks")
    .select("id, home_score, away_score")
    .eq("match_id", gameId);

  if (error) {
    return { error: error.message, updated: 0 };
  }

  let updated = 0;
  for (const pick of picks ?? []) {
    const patch: Database["public"]["Tables"]["match_picks"]["Update"] = {
      home_team: homeTeam,
      away_team: awayTeam,
      updated_at: new Date().toISOString(),
    };

    if (
      swapped &&
      pick.home_score !== null &&
      pick.away_score !== null
    ) {
      patch.home_score = pick.away_score;
      patch.away_score = pick.home_score;
    }

    const { error: updateError } = await admin.from("match_picks").update(patch).eq("id", pick.id);
    if (updateError) {
      return { error: updateError.message, updated };
    }

    updated += 1;
  }

  return { error: null, updated };
}

async function applyEspnTeamAlignmentToGame(
  admin: AdminClient,
  game: WorldCupGameWithScores,
  event: EspnParsedEvent,
  options: { applyScores?: boolean; knockoutResolution?: KnockoutResolutionData | null } = {},
): Promise<EspnTeamAlignResult> {
  const shouldApplyScoresOption = options.applyScores ?? true;
  let alignment = getEspnTeamAlignment(game, event);

  if (!alignment.confident) {
    const parsed = parseWorldCupRouteGameId(game.id);
    if (parsed) {
      const resolved = resolveMatch(
        parsed.worldCupMatch,
        buildResolvedMatchContext({ knockoutResolution: options.knockoutResolution ?? { standings: [], bracket: [] } }),
      );
      alignment = getEspnTeamAlignment(
        { home_team: resolved.home.name, away_team: resolved.away.name },
        event,
      );
    }
  }

  const label = `${game.home_team} vs ${game.away_team}`;

  if (!alignment.confident) {
    return {
      locktGameId: game.id,
      match: label,
      espnEventId: event.espnEventId,
      status: "failed",
      reason: alignment.reason,
    };
  }

  const namesChanged =
    game.home_team !== alignment.espnHomeTeam || game.away_team !== alignment.espnAwayTeam;
  const scores = buildAlignedScorePatch(game, alignment, event);
  const statusPatch = shouldApplyEspnStatusPatch(game.status, event.status) ? event.status : undefined;
  const hasEspnScores = event.homeScore !== null || event.awayScore !== null;
  const applyScores =
    shouldApplyScoresOption && shouldApplyEspnScorePatch(game.status, event.status, hasEspnScores);
  const scoreChanged =
    scores.homeScore !== game.home_score || scores.awayScore !== game.away_score;

  if (!alignment.needsSwap && !namesChanged) {
    if (!applyScores && !scoreChanged && statusPatch === undefined) {
      return {
        locktGameId: game.id,
        match: label,
        espnEventId: event.espnEventId,
        status: "unchanged",
        reason: alignment.reason,
      };
    }

    const patch: GameUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (applyScores && hasEspnScores) {
      patch.home_score = scores.homeScore;
      patch.away_score = scores.awayScore;
    }

    if (statusPatch !== undefined) {
      patch.status = statusPatch;
    }

    const { error: gameError } = await admin
      .from("games")
      .update(patch)
      .eq("id", game.id)
      .eq("league", "World Cup");

    if (gameError) {
      return {
        locktGameId: game.id,
        match: label,
        espnEventId: event.espnEventId,
        status: "failed",
        reason: gameError.message,
      };
    }

    return {
      locktGameId: game.id,
      match: label,
      espnEventId: event.espnEventId,
      status: "aligned",
      reason: "Updated ESPN scores/status.",
    };
  }

  const patch: GameUpdate = {
    home_team: alignment.espnHomeTeam,
    away_team: alignment.espnAwayTeam,
    updated_at: new Date().toISOString(),
  };

  if (applyScores && hasEspnScores) {
    patch.home_score = scores.homeScore;
    patch.away_score = scores.awayScore;
  } else if (alignment.needsSwap) {
    patch.home_score = scores.homeScore;
    patch.away_score = scores.awayScore;
  }

  if (statusPatch !== undefined) {
    patch.status = statusPatch;
  }

  const { error: gameError } = await admin
    .from("games")
    .update(patch)
    .eq("id", game.id)
    .eq("league", "World Cup");

  if (gameError) {
    return {
      locktGameId: game.id,
      match: label,
      espnEventId: event.espnEventId,
      status: "failed",
      reason: gameError.message,
    };
  }

  if (alignment.needsSwap) {
    const { error: rootingError } = await swapRootingVotesForGame(admin, game.id);
    if (rootingError) {
      return {
        locktGameId: game.id,
        match: label,
        espnEventId: event.espnEventId,
        status: "failed",
        reason: `Aligned teams but failed to migrate rooting votes: ${rootingError}`,
      };
    }
  }

  const { error: picksError } = await syncMatchPickTeamsForGame(
    admin,
    game.id,
    alignment.espnHomeTeam,
    alignment.espnAwayTeam,
    alignment.needsSwap,
  );

  if (picksError) {
    return {
      locktGameId: game.id,
      match: label,
      espnEventId: event.espnEventId,
      status: "failed",
      reason: `Aligned teams but failed to update match picks: ${picksError}`,
    };
  }

  return {
    locktGameId: game.id,
    match: label,
    espnEventId: event.espnEventId,
    status: alignment.needsSwap ? "swapped" : "aligned",
    reason: alignment.reason,
  };
}

/**
 * Align mapped World Cup games to ESPN home/away ordering.
 * Only updates games with a row in espn_match_map and a resolvable ESPN event.
 */
export async function alignMappedWorldCupGamesToEspn(admin: AdminClient): Promise<EspnTeamAlignReport> {
  const report: EspnTeamAlignReport = {
    scannedMappings: 0,
    fetchedEvents: 0,
    results: [],
    errors: [],
  };

  const knockoutResolution = await fetchKnockoutResolutionData();

  const { mappings, error: mapError } = await loadEspnMatchMappings(admin);
  if (mapError || !mappings) {
    report.errors.push(mapError ?? "Unable to read espn_match_map.");
    return report;
  }

  report.scannedMappings = mappings.length;
  if (!mappings.length) {
    return report;
  }

  const locktGameIds = mappings.map((row) => row.lockt_game_id);
  const { data: games, error: gamesError } = await admin
    .from("games")
    .select("id, home_team, away_team, starts_at, status, home_score, away_score")
    .eq("league", "World Cup")
    .in("id", locktGameIds);

  if (gamesError || !games) {
    report.errors.push(gamesError?.message ?? "Unable to load mapped World Cup games.");
    return report;
  }

  const gamesById = new Map(games.map((game) => [game.id, game]));
  const dateKeys = collectEspnDatesForGames(games);

  let events: EspnParsedEvent[];
  try {
    const datedEvents = dateKeys.length ? await fetchEspnWorldCupEventsForDates(dateKeys) : [];
    const currentEvents = await fetchEspnWorldCupScoreboard();
    events = mergeEspnEventsById(datedEvents, currentEvents);
    report.fetchedEvents = events.length;
  } catch (error) {
    report.errors.push(error instanceof Error ? error.message : "Failed to fetch ESPN scoreboard.");
    return report;
  }

  const eventsById = new Map(events.map((event) => [event.espnEventId, event]));

  for (const mapping of mappings) {
    const game = gamesById.get(mapping.lockt_game_id);
    if (!game) {
      report.results.push({
        locktGameId: mapping.lockt_game_id,
        match: mapping.espn_event_name ?? mapping.lockt_game_id,
        espnEventId: mapping.espn_event_id,
        status: "skipped",
        reason: "No matching World Cup games row.",
      });
      continue;
    }

    const event = eventsById.get(mapping.espn_event_id);
    if (!event) {
      report.results.push({
        locktGameId: game.id,
        match: `${game.home_team} vs ${game.away_team}`,
        espnEventId: mapping.espn_event_id,
        status: "skipped",
        reason: "Mapped ESPN event not found in fetched scoreboard window.",
      });
      continue;
    }

    const result = await applyEspnTeamAlignmentToGame(admin, game, event, { knockoutResolution });
    report.results.push(result);
    if (result.status === "failed") {
      report.errors.push(`${game.id}: ${result.reason}`);
    }
  }

  return report;
}

/**
 * Sync ESPN scores/status into the games table for every mapped event.
 *
 * Before updating scores, auto-discovers ESPN mappings for near-live World Cup
 * games that do not yet have a row in espn_match_map.
 */
export async function syncEspnWorldCupScores(admin: AdminClient): Promise<EspnSyncSummary> {
  const summary: EspnSyncSummary = {
    fetchedEvents: 0,
    mappedEvents: 0,
    updatedGames: 0,
    skipped: [],
    errors: [],
    autoMapped: [],
  };

  const now = new Date();
  const knockoutResolution = await fetchKnockoutResolutionData();

  const { games, error: gamesError } = await getWorldCupGames(admin);
  if (gamesError || !games) {
    summary.errors.push(gamesError ?? "Unable to load World Cup games.");
    return summary;
  }

  const nearLiveGames = games.filter((game) => isNearLiveWorldCupGame(game, now));

  const { mappings: initialMappings, error: mapError } = await loadEspnMatchMappings(admin);
  if (mapError || !initialMappings) {
    summary.errors.push(mapError ?? "Unable to read espn_match_map.");
    return summary;
  }

  let mappings = initialMappings;
  const mappedGameIdSet = new Set(mappings.map((row) => row.lockt_game_id));
  const unmappedNearLiveGames = nearLiveGames.filter((game) => !mappedGameIdSet.has(game.id));

  let events: EspnParsedEvent[];
  try {
    const dateKeys = collectEspnDatesForGames(
      unmappedNearLiveGames.length ? unmappedNearLiveGames : nearLiveGames,
      now,
    );
    const datedEvents = dateKeys.length ? await fetchEspnWorldCupEventsForDates(dateKeys) : [];
    const currentEvents = await fetchEspnWorldCupScoreboard();
    events = mergeEspnEventsById(datedEvents, currentEvents);
    summary.fetchedEvents = events.length;
  } catch (error) {
    summary.errors.push(error instanceof Error ? error.message : "Failed to fetch ESPN scoreboard.");
    return summary;
  }

  if (unmappedNearLiveGames.length) {
    const discovery = await autoDiscoverEspnMappingsForGames(
      admin,
      unmappedNearLiveGames,
      mappings,
      events,
      knockoutResolution,
    );
    summary.autoMapped = discovery.results;
    summary.errors.push(...discovery.errors);
    mappings = discovery.mappings;
  }

  const gameIdByEspnId = new Map(mappings.map((row) => [row.espn_event_id, row.lockt_game_id]));
  const mappedGameIds = [...new Set(mappings.map((row) => row.lockt_game_id))];
  const { data: mappedGames, error: mappedGamesError } = await admin
    .from("games")
    .select("id, home_team, away_team, starts_at, status, home_score, away_score")
    .eq("league", "World Cup")
    .in("id", mappedGameIds);

  if (mappedGamesError) {
    summary.errors.push(`Unable to load mapped games: ${mappedGamesError.message}`);
    return summary;
  }

  const gamesById = new Map((mappedGames ?? []).map((game) => [game.id, game]));

  for (const event of events) {
    const locktGameId = gameIdByEspnId.get(event.espnEventId);
    if (!locktGameId) {
      summary.skipped.push({ espnEventId: event.espnEventId, reason: "No mapping for ESPN event." });
      continue;
    }

    summary.mappedEvents += 1;

    const game = gamesById.get(locktGameId);
    if (!game) {
      summary.skipped.push({
        espnEventId: event.espnEventId,
        locktGameId,
        reason: "No matching World Cup games row.",
      });
      continue;
    }

    const alignmentResult = await applyEspnTeamAlignmentToGame(admin, game, event, { knockoutResolution });
    if (alignmentResult.status === "failed") {
      summary.errors.push(`${locktGameId}: ${alignmentResult.reason}`);
      continue;
    }

    if (alignmentResult.status === "unchanged") {
      summary.skipped.push({
        espnEventId: event.espnEventId,
        locktGameId,
        reason: "No team, score, or status changes from ESPN.",
      });
      continue;
    }

    gamesById.set(locktGameId, {
      ...game,
      home_team: event.homeTeam ?? game.home_team,
      away_team: event.awayTeam ?? game.away_team,
      home_score: event.homeScore ?? game.home_score,
      away_score: event.awayScore ?? game.away_score,
      status: event.status ?? game.status,
    });

    summary.updatedGames += 1;
  }

  for (const game of mappedGames ?? []) {
    const normalized = normalizeFeedGameStatus(game.status);
    const resolved = applyStaleLiveFinalFallback(normalized, game.starts_at, now);
    if (normalized !== "live" || resolved !== "final") {
      continue;
    }

    const { error: staleError } = await admin
      .from("games")
      .update({
        status: "final",
        updated_at: new Date().toISOString(),
      })
      .eq("id", game.id)
      .eq("league", "World Cup");

    if (staleError) {
      summary.errors.push(`${game.id}: stale-live finalization failed: ${staleError.message}`);
      continue;
    }

    summary.updatedGames += 1;
  }

  return summary;
}

// ---- Optional mapping helper (dry-run; never writes) -----------------------

/**
 * Propose espn_match_map rows by matching ESPN events to the static schedule on
 * kickoff instant (UTC-safe, within a tolerance) plus both team names. Returns
 * suggestions only — it never writes.
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

    const match = schedule.find((candidate) => {
      const home = candidate.homeTeam;
      const away = candidate.awayTeam;
      if (!home || !away) {
        return false;
      }

      const iso = getWorldCupKickoffIso(candidate);
      if (!iso) {
        return false;
      }

      return gameMatchesEspnEvent(
        { home_team: home, away_team: away, starts_at: iso },
        event,
      );
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

type AutoMapCheck = { name: string; pass: boolean; detail: string };

/** Dev-safe checks for ESPN auto-mapping heuristics. */
export function validateEspnAutoMapping(): { ok: boolean; checks: AutoMapCheck[] } {
  const checks: AutoMapCheck[] = [];

  const qatarSwitzerlandGame: WorldCupGameRow = {
    id: "wc-2026-8",
    home_team: "Qatar",
    away_team: "Switzerland",
    starts_at: "2026-06-13T15:00:00-04:00",
    status: "scheduled",
  };

  const qatarSwitzerlandEvent: EspnParsedEvent = {
    espnEventId: "760420",
    name: "Qatar vs Switzerland",
    date: "2026-06-13T19:00Z",
    status: "scheduled",
    homeScore: 0,
    awayScore: 0,
    homeTeam: "Qatar",
    awayTeam: "Switzerland",
  };

  const directMatch = gameMatchesEspnEvent(qatarSwitzerlandGame, qatarSwitzerlandEvent);
  checks.push({
    name: "wc-2026-8 matches Qatar vs Switzerland ESPN event",
    pass: directMatch,
    detail: directMatch ? "matched" : "no match",
  });

  const swappedEvent: EspnParsedEvent = {
    ...qatarSwitzerlandEvent,
    homeTeam: "Switzerland",
    awayTeam: "Qatar",
  };

  const swappedMatch = gameMatchesEspnEvent(qatarSwitzerlandGame, swappedEvent);
  checks.push({
    name: "wc-2026-8 matches reversed home/away ESPN teams",
    pass: swappedMatch,
    detail: swappedMatch ? "matched" : "no match",
  });

  const farKickoffEvent: EspnParsedEvent = {
    ...qatarSwitzerlandEvent,
    date: "2026-06-14T19:00Z",
  };

  checks.push({
    name: "wc-2026-8 rejects kickoff outside tolerance",
    pass: !gameMatchesEspnEvent(qatarSwitzerlandGame, farKickoffEvent),
    detail: farKickoffEvent.date ?? "null",
  });

  const duplicateMatches = findEspnEventsForGame(qatarSwitzerlandGame, [
    qatarSwitzerlandEvent,
    { ...qatarSwitzerlandEvent, espnEventId: "duplicate" },
  ]);

  checks.push({
    name: "duplicate ESPN matches are detectable",
    pass: duplicateMatches.length === 2,
    detail: String(duplicateMatches.length),
  });

  const aliasChecks: Array<[string, string]> = [
    ["United States", "USMNT"],
    ["Bosnia and Herzegovina", "Bosnia-Herzegovina"],
    ["Côte d'Ivoire", "Ivory Coast"],
    ["Czechia", "Czech Republic"],
    ["Türkiye", "Turkey"],
    ["Curacao", "Curaçao"],
  ];

  for (const [left, right] of aliasChecks) {
    checks.push({
      name: `team alias: ${left} / ${right}`,
      pass: teamsMatch(left, right),
      detail: teamsMatch(left, right) ? "matched" : "no match",
    });
  }

  checks.push({
    name: "STATUS_FULL_TIME maps to final",
    pass: mapEspnStatus("STATUS_FULL_TIME", "post", true) === "final",
    detail: "soccer full-time",
  });

  return { ok: checks.every((check) => check.pass), checks };
}
