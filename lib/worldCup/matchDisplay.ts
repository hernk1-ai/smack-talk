import type { WorldCupMatch } from "@/data/worldCupSchedule";
import { formatMatchupLabel } from "@/lib/worldCup/matchupDisplay";
import {
  buildKnockoutResolutionContext,
  isKnockoutScheduleMatch,
  type KnockoutResolutionContext,
  type KnockoutResolutionData,
} from "@/lib/worldCup/knockoutMatchResolver";
import {
  buildResolvedMatchContext,
  resolveMatch,
  type MatchFeedRow,
  type ResolvedMatch,
  type ResolvedMatchContext,
} from "@/lib/worldCup/resolvedMatch";

export type MatchDisplay = {
  displayHomeTeam: string;
  displayAwayTeam: string;
  displayTitle: string;
  isResolved: boolean;
  fallbackLabel: string;
};

export type GameTeamSnapshot = {
  home_team?: string | null;
  away_team?: string | null;
};

export { buildKnockoutResolutionContext, type KnockoutResolutionContext, type KnockoutResolutionData };
export type { ResolvedMatch, ResolvedMatchContext, MatchFeedRow } from "@/lib/worldCup/resolvedMatch";
export {
  buildResolvedMatchContext,
  buildResolvedMatchMap,
  getResolvedMatch,
  resolveAllMatches,
  resolveMatch,
  resolveMatchByGameId,
  resolveMatchById,
  buildResolvedMatchShareText,
  withResolvedMatchGames,
} from "@/lib/worldCup/resolvedMatch";
export type { ResolvedMatchContextInput } from "@/lib/worldCup/resolvedMatch";

function toMatchDisplay(resolved: ResolvedMatch): MatchDisplay {
  return {
    displayHomeTeam: resolved.home.name,
    displayAwayTeam: resolved.away.name,
    displayTitle: resolved.title,
    isResolved: resolved.isResolved,
    fallbackLabel: resolved.fallbackTitle,
  };
}

/** @deprecated Prefer resolveMatch() — kept for incremental migration. */
export function resolveMatchDisplay(
  match: WorldCupMatch,
  context: KnockoutResolutionContext | null | undefined,
  game?: GameTeamSnapshot | MatchFeedRow | null,
  now: Date = new Date(),
): MatchDisplay {
  const resolvedContext: ResolvedMatchContext = {
    knockoutContext: context ?? null,
    gamesById: new Map(
      game && "id" in game ? [[(game as MatchFeedRow).id, game as MatchFeedRow]] : [],
    ),
    teamFlags: buildResolvedMatchContext({ knockoutResolution: { standings: [], bracket: [] } }).teamFlags,
    now,
  };

  return toMatchDisplay(resolveMatch(match, resolvedContext));
}

export function resolveMatchDisplayFromData(
  match: WorldCupMatch,
  data: KnockoutResolutionData | null | undefined,
  game?: GameTeamSnapshot | MatchFeedRow | null,
  now: Date = new Date(),
): MatchDisplay {
  const resolvedContext = buildResolvedMatchContext({
    knockoutResolution: data ?? { standings: [], bracket: [] },
    games: game && "id" in game ? [game as MatchFeedRow] : [],
    nowIso: now.toISOString(),
  });

  return toMatchDisplay(resolveMatch(match, resolvedContext));
}

export function isKnockoutScheduleMatchExport(match: WorldCupMatch): boolean {
  return isKnockoutScheduleMatch(match);
}

export function formatResolvedMatchupLabel(resolved: ResolvedMatch): string {
  return formatMatchupLabel(resolved.home.name, resolved.away.name);
}
