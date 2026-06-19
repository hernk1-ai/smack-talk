import type { Metadata } from "next";
import { cache } from "react";

import { createAdminClient } from "@/lib/supabase/admin";
import { parseWorldCupRouteGameId } from "@/lib/supabase/resolveArenaGame";
import type { Game } from "@/lib/supabase/types";
import { SITEMAP_BASE_URL } from "@/lib/seo/sitemap";
import {
  formatLocalKickoff,
  getLocalDateLabel,
  WORLD_CUP_SCHEDULE_FALLBACK_TIME_ZONE,
} from "@/lib/worldCup/localSchedule";
import { formatMatchupLabel } from "@/lib/worldCup/matchupDisplay";

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

  const { worldCupMatch } = parsed;
  let game: Game | null = null;
  const admin = createAdminClient();
  if (admin) {
    const { data } = await admin.from("games").select("*").eq("id", gameId).maybeSingle();
    game = data;
  }

  const homeTeam = game?.home_team ?? worldCupMatch.homeTeam;
  const awayTeam = game?.away_team ?? worldCupMatch.awayTeam ?? "TBD";
  const timeZone = WORLD_CUP_SCHEDULE_FALLBACK_TIME_ZONE;
  const kickoffLabel = `${getLocalDateLabel(worldCupMatch, timeZone)} · ${formatLocalKickoff(worldCupMatch, timeZone)} ET`;
  const venueParts = [worldCupMatch.city, worldCupMatch.venue].filter(Boolean);
  const venueLine = venueParts.length ? venueParts.join(" · ") : null;
  const stage =
    game?.period?.trim() ||
    (worldCupMatch.stage === "Group Stage" ? `Group ${worldCupMatch.group}` : worldCupMatch.stage);

  return {
    gameId,
    homeTeam,
    awayTeam,
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
