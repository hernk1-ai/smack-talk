import type { WorldCupMatch } from "@/data/worldCupSchedule";
import { formatMatchupLabel } from "@/lib/worldCup/matchupDisplay";
import {
  buildKnockoutResolutionContext,
  isKnockoutScheduleMatch,
  isKnockoutSeedToken,
  resolveKnockoutMatchup,
  type KnockoutResolutionContext,
  type KnockoutResolutionData,
} from "@/lib/worldCup/knockoutMatchResolver";

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

function buildFallbackLabel(match: WorldCupMatch): string {
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

/**
 * Shared display resolver for Schedule, Match Hub, and Game Room.
 * Knockout matches always prefer FIFA standings/bracket resolution over stale game-row seeds.
 */
export function resolveMatchDisplay(
  match: WorldCupMatch,
  context: KnockoutResolutionContext | null | undefined,
  game?: GameTeamSnapshot | null,
): MatchDisplay {
  const fallbackLabel = buildFallbackLabel(match);

  if (!isKnockoutScheduleMatch(match)) {
    const displayHomeTeam =
      game?.home_team && isRealTeamLabel(game.home_team) ? game.home_team : match.homeTeam;
    const displayAwayTeam =
      game?.away_team && isRealTeamLabel(game.away_team) ? game.away_team : match.awayTeam ?? "TBD";

    return {
      displayHomeTeam,
      displayAwayTeam,
      displayTitle: formatMatchupLabel(displayHomeTeam, displayAwayTeam),
      isResolved: false,
      fallbackLabel,
    };
  }

  const resolved = resolveKnockoutMatchup(match, context);
  const isResolved =
    isRealTeamLabel(resolved.homeTeam) || isRealTeamLabel(resolved.awayTeam);

  return {
    displayHomeTeam: resolved.homeTeam,
    displayAwayTeam: resolved.awayTeam,
    displayTitle: formatMatchupLabel(resolved.homeTeam, resolved.awayTeam),
    isResolved,
    fallbackLabel,
  };
}

export function resolveMatchDisplayFromData(
  match: WorldCupMatch,
  data: KnockoutResolutionData | null | undefined,
  game?: GameTeamSnapshot | null,
): MatchDisplay {
  const context = data ? buildKnockoutResolutionContext(data) : null;
  return resolveMatchDisplay(match, context, game);
}
