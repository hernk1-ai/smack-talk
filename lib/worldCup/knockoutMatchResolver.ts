import { getWorldCupKickoffIso, type WorldCupMatch } from "@/data/worldCupSchedule";
import type { KnockoutBracketRound } from "@/lib/sports/fifaWorldCupStandingsSync";
import type { WorldCupStandingRow } from "@/lib/worldCup/standingsTypes";

export type KnockoutResolutionData = {
  standings: Pick<WorldCupStandingRow, "group_name" | "rank" | "team_name" | "status" | "flag_url">[];
  bracket: KnockoutBracketRound[];
};

export type KnockoutResolutionContext = {
  standingsByGroup: Map<string, WorldCupStandingRow[]>;
  bracketByKickoff: Map<number, BracketSlotTeams>;
};

type BracketSlotTeams = {
  homeTeam: string | null;
  awayTeam: string | null;
};

export type ResolvedKnockoutMatchup = {
  homeTeam: string;
  awayTeam: string;
};

const GROUP_RANK_SEED = /^([12])([A-L])$/;
const THIRD_PLACE_SLOT_SEED = /^3([A-L]+)$/;
const WINNER_LOSER_SEED = /^[WL]\d+$/;

export function isKnockoutScheduleMatch(match: WorldCupMatch): boolean {
  return match.group === "KO";
}

export function isKnockoutSeedToken(token: string): boolean {
  const normalized = token.trim();
  if (!normalized) {
    return false;
  }

  return GROUP_RANK_SEED.test(normalized) || THIRD_PLACE_SLOT_SEED.test(normalized) || WINNER_LOSER_SEED.test(normalized);
}

export function buildKnockoutResolutionContext(data: KnockoutResolutionData): KnockoutResolutionContext {
  const standingsByGroup = new Map<string, WorldCupStandingRow[]>();

  for (const row of data.standings) {
    const bucket = standingsByGroup.get(row.group_name) ?? [];
    bucket.push(row as WorldCupStandingRow);
    standingsByGroup.set(row.group_name, bucket);
  }

  for (const [groupName, rows] of standingsByGroup) {
    standingsByGroup.set(
      groupName,
      [...rows].sort((a, b) => a.rank - b.rank),
    );
  }

  return {
    standingsByGroup,
    bracketByKickoff: buildBracketByKickoff(data.bracket),
  };
}

export function resolveKnockoutMatchup(
  match: WorldCupMatch,
  context: KnockoutResolutionContext | null | undefined,
): ResolvedKnockoutMatchup {
  if (!isKnockoutScheduleMatch(match)) {
    return {
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam ?? "TBD",
    };
  }

  const homeSeed = match.homeTeam;
  const awaySeed = match.awayTeam ?? "TBD";
  const bracket = lookupBracketTeams(match, context?.bracketByKickoff);

  const homeResolved = resolveSlot(homeSeed, "home", bracket, context);
  const awayResolved = resolveSlot(awaySeed, "away", bracket, context);

  return {
    homeTeam: formatResolvedTeamLabel(homeSeed, homeResolved, awayResolved !== null),
    awayTeam: formatResolvedTeamLabel(awaySeed, awayResolved, homeResolved !== null),
  };
}

export function resolveKnockoutMatchLabel(
  match: WorldCupMatch,
  context: KnockoutResolutionContext | null | undefined,
): string {
  const { homeTeam, awayTeam } = resolveKnockoutMatchup(match, context);
  return `${homeTeam} vs ${awayTeam}`;
}

function buildBracketByKickoff(bracket: KnockoutBracketRound[]): Map<number, BracketSlotTeams> {
  const map = new Map<number, BracketSlotTeams>();

  for (const round of bracket) {
    for (const entry of round.matches) {
      if (!entry.date) {
        continue;
      }

      const kickoffMs = new Date(entry.date).getTime();
      if (!Number.isFinite(kickoffMs)) {
        continue;
      }

      map.set(kickoffMs, {
        homeTeam: normalizeBracketTeam(entry.homeTeam),
        awayTeam: normalizeBracketTeam(entry.awayTeam),
      });
    }
  }

  return map;
}

function lookupBracketTeams(
  match: WorldCupMatch,
  bracketByKickoff: Map<number, BracketSlotTeams> | undefined,
): BracketSlotTeams | null {
  if (!bracketByKickoff?.size) {
    return null;
  }

  const kickoffIso = getWorldCupKickoffIso(match);
  if (!kickoffIso) {
    return null;
  }

  const kickoffMs = new Date(kickoffIso).getTime();
  const exact = bracketByKickoff.get(kickoffMs);
  if (exact) {
    return exact;
  }

  // Allow small clock drift between FIFA UTC timestamps and ET-derived kickoffs.
  for (const [candidateMs, teams] of bracketByKickoff) {
    if (Math.abs(candidateMs - kickoffMs) <= 90_000) {
      return teams;
    }
  }

  return null;
}

function resolveSlot(
  seed: string,
  side: "home" | "away",
  bracket: BracketSlotTeams | null,
  context: KnockoutResolutionContext | null | undefined,
): string | null {
  const bracketTeam = side === "home" ? bracket?.homeTeam : bracket?.awayTeam;
  if (bracketTeam) {
    return bracketTeam;
  }

  if (WINNER_LOSER_SEED.test(seed)) {
    return null;
  }

  if (GROUP_RANK_SEED.test(seed)) {
    return resolveGroupRankSeed(seed, context);
  }

  if (THIRD_PLACE_SLOT_SEED.test(seed)) {
    return resolveThirdPlaceSlotSeed(seed, context);
  }

  return null;
}

function resolveGroupRankSeed(seed: string, context: KnockoutResolutionContext | null | undefined): string | null {
  const match = GROUP_RANK_SEED.exec(seed);
  if (!match || !context) {
    return null;
  }

  const rank = Number(match[1]);
  const groupName = `Group ${match[2]}`;
  const row = context.standingsByGroup.get(groupName)?.find((entry) => entry.rank === rank);
  return row?.team_name ?? null;
}

function resolveThirdPlaceSlotSeed(seed: string, context: KnockoutResolutionContext | null | undefined): string | null {
  const match = THIRD_PLACE_SLOT_SEED.exec(seed);
  if (!match || !context) {
    return null;
  }

  const qualifiedTeams: string[] = [];

  for (const letter of match[1]) {
    const groupName = `Group ${letter}`;
    const thirdPlace = context.standingsByGroup.get(groupName)?.find((entry) => entry.rank === 3);
    if (thirdPlace && isConfirmedThirdPlaceQualifier(thirdPlace)) {
      qualifiedTeams.push(thirdPlace.team_name);
    }
  }

  if (qualifiedTeams.length === 1) {
    return qualifiedTeams[0] ?? null;
  }

  return null;
}

function isConfirmedThirdPlaceQualifier(row: Pick<WorldCupStandingRow, "status">): boolean {
  return row.status === "ConfirmedQualified";
}

function normalizeBracketTeam(team: string | null | undefined): string | null {
  if (!team) {
    return null;
  }

  const trimmed = team.trim();
  if (!trimmed || trimmed.toLowerCase() === "tbd") {
    return null;
  }

  return trimmed;
}

function formatResolvedTeamLabel(seed: string, resolved: string | null, peerResolved: boolean): string {
  if (resolved) {
    return resolved;
  }

  if (WINNER_LOSER_SEED.test(seed)) {
    return seed;
  }

  if (isKnockoutSeedToken(seed)) {
    return peerResolved ? "TBD" : seed;
  }

  return seed;
}
