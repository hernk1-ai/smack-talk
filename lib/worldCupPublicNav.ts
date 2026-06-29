import { getWorldCupKickoffIso, getWorldCupMatchId, type WorldCupMatch } from "@/data/worldCupSchedule";
import { isFeedGameLive } from "@/lib/worldCup/gameStatus";
import { SHOW_GAME_ROOM } from "@/lib/productConfig";
import type { ResolvedMatch } from "@/lib/worldCup/resolvedMatch";

export type WorldCupMatchCta = {
  label: string;
  href: string;
};

export function getWorldCupMatchPublicCta(
  match: WorldCupMatch,
  now = new Date(),
  feedStatus?: string | null,
): WorldCupMatchCta {
  const gameRoomHref = `/game/${getWorldCupMatchId(match)}`;
  const matchRoomHref = `/matches/${match.id}`;
  const startsAt = getWorldCupKickoffIso(match);
  const isLive = feedStatus ? isFeedGameLive(feedStatus, startsAt, now) : false;
  const kickoffMs = startsAt ? new Date(startsAt).getTime() : Number.NaN;
  const beforeKickoff = Number.isFinite(kickoffMs) && now.getTime() < kickoffMs;

  if (isLive) {
    return {
      label: "Join Game Room",
      href: SHOW_GAME_ROOM ? matchRoomHref : gameRoomHref,
    };
  }

  if (beforeKickoff) {
    return {
      label: "Join Game Room",
      href: gameRoomHref,
    };
  }

  return {
    label: "View Match",
    href: matchRoomHref,
  };
}

export function buildGameRoomShareText(resolved: ResolvedMatch): string {
  return `Join me in the Lockt Game Room for ${resolved.title}.`;
}

/** @deprecated Use buildGameRoomShareText(resolvedMatch) */
export function buildGameRoomShareTextFromSchedule(match: WorldCupMatch) {
  const away = match.awayTeam ?? "TBD";
  return `Join me in the Lockt Game Room for ${match.homeTeam} vs ${away}.`;
}
