import type { Metadata } from "next";
import { cache } from "react";

import { SITEMAP_BASE_URL } from "@/lib/seo/sitemap";
import {
  formatLocalKickoff,
  getLocalDateLabel,
  WORLD_CUP_SCHEDULE_FALLBACK_TIME_ZONE,
} from "@/lib/worldCup/localSchedule";
import { fetchResolvedMatchContext } from "@/lib/worldCup/fetchResolvedMatchContext";
import { resolveMatchByGameId } from "@/lib/worldCup/resolvedMatch";
import { formatMatchupLabel } from "@/lib/worldCup/matchupDisplay";
import { parseWorldCupRouteGameId } from "@/lib/supabase/resolveArenaGame";

export type GameRoomPageData = {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  kickoffLabel: string;
  venueLine: string | null;
  stage: string | null;
  canonicalUrl: string;
};

export const resolveGameRoomPageData = cache(async (gameId: string): Promise<GameRoomPageData | null> => {
  const parsed = parseWorldCupRouteGameId(gameId);
  if (!parsed) {
    return null;
  }

  const resolvedContext = await fetchResolvedMatchContext();
  const resolved = resolveMatchByGameId(gameId, resolvedContext);
  if (!resolved) {
    return null;
  }

  const timeZone = WORLD_CUP_SCHEDULE_FALLBACK_TIME_ZONE;
  const kickoffLabel = `${getLocalDateLabel(resolved.match, timeZone)} · ${formatLocalKickoff(resolved.match, timeZone)} ET`;
  const venueParts = [resolved.city, resolved.venue].filter(Boolean);
  const venueLine = venueParts.length ? venueParts.join(" · ") : null;
  const stage = resolved.feed.period?.trim() || resolved.stage;

  return {
    gameId,
    homeTeam: resolved.home.name,
    awayTeam: resolved.away.name,
    kickoffLabel,
    venueLine,
    stage,
    canonicalUrl: `${SITEMAP_BASE_URL}/game/${gameId}`,
  };
});

export function buildGameRoomPageMetadata(data: GameRoomPageData): Metadata {
  const matchup = formatMatchupLabel(data.homeTeam, data.awayTeam);
  const title = `${matchup} | Lockt Game Room`;
  const description = `Follow ${matchup} live. Join the Lockt Game Room for scores, rooting activity, and match discussion.`;

  return {
    title,
    description,
    alternates: {
      canonical: data.canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: data.canonicalUrl,
      siteName: "LOCKT",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
