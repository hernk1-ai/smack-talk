import { teamsMatch } from "@/lib/sports/espnTeamNames";
import type { EspnParsedEvent } from "@/lib/sports/espnWorldCupSync";

export type EspnTeamPair = {
  homeTeam: string;
  awayTeam: string;
};

export type EspnTeamAlignment = {
  confident: boolean;
  needsSwap: boolean;
  espnHomeTeam: string;
  espnAwayTeam: string;
  reason: string;
};

/**
 * Parse ESPN event titles like "Paraguay at United States".
 * Format is always: away team at home team.
 */
export function parseEspnAtEventName(name: string): EspnTeamPair | null {
  const match = /^(.+?)\s+at\s+(.+)$/i.exec(name.trim());
  if (!match) {
    return null;
  }

  const awayTeam = match[1]?.trim();
  const homeTeam = match[2]?.trim();
  if (!awayTeam || !homeTeam) {
    return null;
  }

  return { awayTeam, homeTeam };
}

/** Resolve ESPN home/away teams from competitors first, then event title. */
export function resolveEspnTeams(event: Pick<EspnParsedEvent, "name" | "homeTeam" | "awayTeam">): EspnTeamPair | null {
  if (event.homeTeam && event.awayTeam) {
    return { homeTeam: event.homeTeam, awayTeam: event.awayTeam };
  }

  return parseEspnAtEventName(event.name);
}

export function getEspnTeamAlignment(
  game: { home_team: string; away_team: string },
  event: Pick<EspnParsedEvent, "name" | "homeTeam" | "awayTeam">,
): EspnTeamAlignment {
  const espnTeams = resolveEspnTeams(event);
  if (!espnTeams) {
    return {
      confident: false,
      needsSwap: false,
      espnHomeTeam: game.home_team,
      espnAwayTeam: game.away_team,
      reason: "Unable to resolve ESPN home/away teams.",
    };
  }

  const direct =
    teamsMatch(game.home_team, espnTeams.homeTeam) && teamsMatch(game.away_team, espnTeams.awayTeam);
  const swapped =
    teamsMatch(game.home_team, espnTeams.awayTeam) && teamsMatch(game.away_team, espnTeams.homeTeam);

  if (direct) {
    const namesChanged =
      game.home_team !== espnTeams.homeTeam || game.away_team !== espnTeams.awayTeam;

    return {
      confident: true,
      needsSwap: false,
      espnHomeTeam: espnTeams.homeTeam,
      espnAwayTeam: espnTeams.awayTeam,
      reason: namesChanged ? "Normalize team labels to ESPN." : "Teams already match ESPN home/away.",
    };
  }

  if (swapped) {
    return {
      confident: true,
      needsSwap: true,
      espnHomeTeam: espnTeams.homeTeam,
      espnAwayTeam: espnTeams.awayTeam,
      reason: "Lockt home/away are reversed relative to ESPN.",
    };
  }

  return {
    confident: false,
    needsSwap: false,
    espnHomeTeam: espnTeams.homeTeam,
    espnAwayTeam: espnTeams.awayTeam,
    reason: "Teams do not match ESPN event.",
  };
}

export function buildAlignedScorePatch(
  game: { home_score: number; away_score: number },
  alignment: EspnTeamAlignment,
  event: Pick<EspnParsedEvent, "homeScore" | "awayScore">,
) {
  let homeScore = game.home_score;
  let awayScore = game.away_score;

  if (alignment.needsSwap) {
    homeScore = game.away_score;
    awayScore = game.home_score;
  }

  if (event.homeScore !== null) {
    homeScore = event.homeScore;
  }

  if (event.awayScore !== null) {
    awayScore = event.awayScore;
  }

  return { homeScore, awayScore };
}
