import {
  getWorldCupKickoffIso,
  getWorldCupMatchById,
  getWorldCupMatchId,
  worldCupSchedule,
  type WorldCupMatch,
} from "@/data/worldCupSchedule";
import { worldCupTeams } from "@/data/worldCupGroups";
import { parseWorldCupRouteGameId } from "@/lib/supabase/resolveArenaGame";
import {
  buildKnockoutResolutionContext,
  isKnockoutScheduleMatch,
  isKnockoutSeedToken,
  resolveKnockoutMatchup,
  type KnockoutResolutionContext,
  type KnockoutResolutionData,
} from "@/lib/worldCup/knockoutMatchResolver";
import { formatMatchupLabel } from "@/lib/worldCup/matchupDisplay";
import { scheduleStatusFromFeed } from "@/lib/worldCup/matchSelection";
import type { ScheduleMatchStatus } from "@/lib/worldCup/scheduleStatus";
import type { WorldCupGameSnapshot } from "@/lib/worldCupMatchResolver";

export type ResolvedTeam = {
  name: string;
  seed: string | null;
  flagEmoji: string | null;
  flagUrl: string | null;
};

export type ResolvedMatchFeed = {
  status: ScheduleMatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  clock: string | null;
  period: string | null;
  eventName: string | null;
  startsAt: string | null;
};

/** Canonical merged match object: FIFA teams + ESPN/feed status and scores. */
export type ResolvedMatch = {
  matchId: number;
  gameId: string;
  match: WorldCupMatch;
  home: ResolvedTeam;
  away: ResolvedTeam;
  title: string;
  fallbackTitle: string;
  isResolved: boolean;
  city: string;
  venue: string;
  stage: string;
  group: WorldCupMatch["group"];
  feed: ResolvedMatchFeed;
  gameRoomHref: string;
  scheduleHref: string;
};

export type MatchFeedRow = Pick<
  WorldCupGameSnapshot,
  "id" | "status" | "starts_at" | "home_score" | "away_score" | "home_team" | "away_team" | "clock" | "period" | "event_name"
>;

/** Serializable input for server props and API responses. */
export type ResolvedMatchContextInput = {
  knockoutResolution: KnockoutResolutionData;
  games?: MatchFeedRow[];
  nowIso?: string;
};

export type ResolvedMatchContext = {
  knockoutContext: KnockoutResolutionContext | null;
  gamesById: Map<string, MatchFeedRow>;
  teamFlags: Map<string, { flagEmoji: string | null; flagUrl: string | null }>;
  now: Date;
};

const TEAM_CATALOG = new Map<string, { flagEmoji: string | null; flagUrl: string | null }>(
  worldCupTeams.map((team) => [
    team.name.trim().toLowerCase(),
    { flagEmoji: team.flag, flagUrl: null },
  ]),
);

function buildTeamFlags(knockoutResolution: KnockoutResolutionData): Map<string, { flagEmoji: string | null; flagUrl: string | null }> {
  const flags = new Map(TEAM_CATALOG);

  for (const row of knockoutResolution.standings) {
    const key = row.team_name.trim().toLowerCase();
    const existing = flags.get(key) ?? { flagEmoji: null, flagUrl: null };
    flags.set(key, {
      flagEmoji: existing.flagEmoji,
      flagUrl: row.flag_url ?? existing.flagUrl,
    });
  }

  return flags;
}

function lookupTeamFlags(
  teamName: string,
  teamFlags: Map<string, { flagEmoji: string | null; flagUrl: string | null }>,
): { flagEmoji: string | null; flagUrl: string | null } {
  return teamFlags.get(teamName.trim().toLowerCase()) ?? { flagEmoji: null, flagUrl: null };
}

function buildFallbackTitle(match: WorldCupMatch): string {
  return `${match.homeTeam} vs ${match.awayTeam ?? "TBD"}`;
}

function isPlaceholderTeamLabel(value: string | null | undefined): boolean {
  if (!value?.trim()) {
    return true;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "tbd" || normalized === "home" || normalized === "away";
}

function isRealTeamLabel(value: string): boolean {
  return !isPlaceholderTeamLabel(value) && !isKnockoutSeedToken(value);
}

function resolveTeamNames(
  match: WorldCupMatch,
  knockoutContext: KnockoutResolutionContext | null,
  game?: MatchFeedRow | null,
): { home: string; away: string; isResolved: boolean } {
  const fallbackTitle = buildFallbackTitle(match);

  if (!isKnockoutScheduleMatch(match)) {
    const home =
      game?.home_team && isRealTeamLabel(game.home_team) ? game.home_team : match.homeTeam;
    const away =
      game?.away_team && isRealTeamLabel(game.away_team) ? game.away_team : match.awayTeam ?? "TBD";

    return { home, away, isResolved: false };
  }

  const resolved = resolveKnockoutMatchup(match, knockoutContext);
  const isResolved =
    isRealTeamLabel(resolved.homeTeam) || isRealTeamLabel(resolved.awayTeam);

  return {
    home: resolved.homeTeam,
    away: resolved.awayTeam,
    isResolved,
  };
}

function resolveFeed(
  match: WorldCupMatch,
  game: MatchFeedRow | null | undefined,
  now: Date,
): ResolvedMatchFeed {
  const scheduleKickoff = getWorldCupKickoffIso(match);
  const startsAt = game?.starts_at ?? scheduleKickoff;
  const status = scheduleStatusFromFeed(game?.status, startsAt, now, game ?? undefined);

  return {
    status,
    homeScore: game ? game.home_score : null,
    awayScore: game ? game.away_score : null,
    clock: game?.clock ?? null,
    period: game?.period ?? null,
    eventName: game?.event_name ?? null,
    startsAt,
  };
}

function toResolvedTeam(
  name: string,
  seed: string | null,
  teamFlags: Map<string, { flagEmoji: string | null; flagUrl: string | null }>,
): ResolvedTeam {
  const flags = lookupTeamFlags(name, teamFlags);

  return {
    name,
    seed,
    flagEmoji: flags.flagEmoji,
    flagUrl: flags.flagUrl,
  };
}

export function buildResolvedMatchContext(input: ResolvedMatchContextInput): ResolvedMatchContext {
  const knockoutResolution = input.knockoutResolution ?? { standings: [], bracket: [] };
  const knockoutContext =
    knockoutResolution.standings.length || knockoutResolution.bracket.length
      ? buildKnockoutResolutionContext(knockoutResolution)
      : null;

  return {
    knockoutContext,
    gamesById: new Map((input.games ?? []).map((game) => [game.id, game])),
    teamFlags: buildTeamFlags(knockoutResolution),
    now: input.nowIso ? new Date(input.nowIso) : new Date(),
  };
}

export function withResolvedMatchGames(
  context: ResolvedMatchContext,
  games: MatchFeedRow[],
  now: Date = new Date(),
): ResolvedMatchContext {
  return {
    ...context,
    gamesById: new Map(games.map((game) => [game.id, game])),
    now,
  };
}

export function resolveMatch(match: WorldCupMatch, context: ResolvedMatchContext): ResolvedMatch {
  const gameId = getWorldCupMatchId(match);
  const game = context.gamesById.get(gameId) ?? null;
  const teamNames = resolveTeamNames(match, context.knockoutContext, game);
  const feed = resolveFeed(match, game, context.now);
  const stage =
    match.stage === "Group Stage" ? `Group ${match.group}` : match.stage;

  return {
    matchId: match.id,
    gameId,
    match,
    home: toResolvedTeam(teamNames.home, match.homeTeam, context.teamFlags),
    away: toResolvedTeam(teamNames.away, match.awayTeam ?? "TBD", context.teamFlags),
    title: formatMatchupLabel(teamNames.home, teamNames.away),
    fallbackTitle: buildFallbackTitle(match),
    isResolved: teamNames.isResolved,
    city: match.city,
    venue: match.venue,
    stage,
    group: match.group,
    feed,
    gameRoomHref: `/game/${gameId}`,
    scheduleHref: `/schedule`,
  };
}

export function resolveMatchByGameId(gameId: string, context: ResolvedMatchContext): ResolvedMatch | null {
  const parsed = parseWorldCupRouteGameId(gameId);
  if (!parsed) {
    return null;
  }

  return resolveMatch(parsed.worldCupMatch, context);
}

export function resolveMatchById(matchId: number, context: ResolvedMatchContext): ResolvedMatch | null {
  const match = getWorldCupMatchById(matchId);
  if (!match) {
    return null;
  }

  return resolveMatch(match, context);
}

export function resolveAllMatches(
  schedule: WorldCupMatch[] = worldCupSchedule,
  context: ResolvedMatchContext,
): ResolvedMatch[] {
  return schedule.map((match) => resolveMatch(match, context));
}

export function buildResolvedMatchMap(
  schedule: WorldCupMatch[] = worldCupSchedule,
  context: ResolvedMatchContext,
): Map<number, ResolvedMatch> {
  return new Map(resolveAllMatches(schedule, context).map((resolved) => [resolved.matchId, resolved]));
}

export function getResolvedMatch(
  matchOrId: WorldCupMatch | number | string,
  context: ResolvedMatchContext,
): ResolvedMatch | null {
  if (typeof matchOrId === "number") {
    return resolveMatchById(matchOrId, context);
  }

  if (typeof matchOrId === "string") {
    return resolveMatchByGameId(matchOrId, context);
  }

  return resolveMatch(matchOrId, context);
}

/** Share copy using resolved team names. */
export function buildResolvedMatchShareText(resolved: ResolvedMatch): string {
  return `Join me in the Lockt Game Room for ${resolved.title}.`;
}
