import { getWorldCupMatchId, type WorldCupMatch } from "@/data/worldCupSchedule";
import { getWorldCupMatchStatus } from "@/lib/worldCupMatchStatus";
import { SHOW_GAME_ROOM } from "@/lib/productConfig";

export type WorldCupMatchCta = {
  label: string;
  href: string;
};

export function getWorldCupMatchPublicCta(match: WorldCupMatch, now = new Date()): WorldCupMatchCta {
  const lifecycle = getWorldCupMatchStatus(match, now);
  const gameRoomHref = `/game/${getWorldCupMatchId(match)}`;
  const matchRoomHref = `/matches/${match.id}`;

  if (lifecycle === "live") {
    return {
      label: "Join Game Room",
      href: SHOW_GAME_ROOM ? matchRoomHref : gameRoomHref,
    };
  }

  if (lifecycle === "upcoming") {
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

export function buildGameRoomShareText(match: WorldCupMatch) {
  const away = match.awayTeam ?? "TBD";
  return `Join me in the Lockt Game Room for ${match.homeTeam} vs ${away}.`;
}
