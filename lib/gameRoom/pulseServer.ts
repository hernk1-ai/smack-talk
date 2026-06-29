import type { SupabaseClient } from "@supabase/supabase-js";

import {
  PULSE_CHAT_WINDOW_MS,
  PULSE_MAX_ITEMS,
  PULSE_PRESENCE_WINDOW_MS,
  PULSE_SUPPORT_RECENT_WINDOW_MS,
  type GameRoomPulseResponse,
  type PulseItem,
} from "@/lib/gameRoom/pulse";
import { getActiveViewerCount } from "@/lib/gameRoom/presenceServer";
import { getRootingCounts } from "@/lib/gameRoom/rootingServer";
import { parseWorldCupRouteGameId } from "@/lib/supabase/resolveArenaGame";
import type { Database } from "@/lib/supabase/types";
import { fetchKnockoutResolutionData } from "@/lib/worldCup/fetchKnockoutResolution";
import {
  buildResolvedMatchContext,
  resolveMatchByGameId,
  type MatchFeedRow,
} from "@/lib/worldCup/resolvedMatch";

type AdminClient = SupabaseClient<Database>;

type TeamNames = {
  homeTeam: string;
  awayTeam: string;
};

type PulseMetrics = {
  recentJoins: number;
  recentMessages: number;
  activeViewers: number;
  homeCount: number;
  awayCount: number;
  recentHomeVotes: number;
  recentAwayVotes: number;
};

function scopeRoom<T extends { eq: (column: string, value: string) => T; is: (column: string, value: null) => T }>(
  query: T,
  roomCode: string | null,
): T {
  return roomCode ? query.eq("room_code", roomCode) : query.is("room_code", null);
}

async function countRecentJoins(
  admin: AdminClient,
  gameId: string,
  roomCode: string | null,
  sinceIso: string,
): Promise<number> {
  let query = admin
    .from("game_room_presence")
    .select("id", { count: "exact", head: true })
    .eq("game_id", gameId)
    .gte("created_at", sinceIso);

  query = scopeRoom(query, roomCode);

  const { count, error } = await query;
  if (error) {
    return 0;
  }

  return count ?? 0;
}

async function countRecentMessages(
  admin: AdminClient,
  gameId: string,
  roomCode: string | null,
  sinceIso: string,
): Promise<number> {
  let query = admin
    .from("match_room_messages")
    .select("id", { count: "exact", head: true })
    .eq("game_id", gameId)
    .gte("created_at", sinceIso);

  query = scopeRoom(query, roomCode);

  const { count, error } = await query;
  if (error) {
    return 0;
  }

  return count ?? 0;
}

async function countRecentRootingBySide(
  admin: AdminClient,
  gameId: string,
  roomCode: string | null,
  sinceIso: string,
): Promise<{ recentHomeVotes: number; recentAwayVotes: number }> {
  let query = admin
    .from("match_rooting_votes")
    .select("team_key")
    .eq("game_id", gameId)
    .gte("updated_at", sinceIso);

  if (roomCode) {
    query = query.eq("room_code", roomCode);
  } else {
    query = query.is("room_code", null);
  }

  const { data, error } = await query;
  if (error) {
    return { recentHomeVotes: 0, recentAwayVotes: 0 };
  }

  const rows = data ?? [];
  return {
    recentHomeVotes: rows.filter((row) => row.team_key === "home").length,
    recentAwayVotes: rows.filter((row) => row.team_key === "away").length,
  };
}

async function resolveTeamNames(admin: AdminClient, gameId: string): Promise<TeamNames> {
  const { data } = await admin
    .from("games")
    .select("id, home_team, away_team, status, home_score, away_score, starts_at, clock, period, event_name")
    .eq("id", gameId)
    .maybeSingle();

  if (parseWorldCupRouteGameId(gameId)) {
    const knockoutResolution = await fetchKnockoutResolutionData();
    const context = buildResolvedMatchContext({
      knockoutResolution,
      games: data ? [data as MatchFeedRow] : [],
    });
    const resolved = resolveMatchByGameId(gameId, context);

    if (resolved) {
      return {
        homeTeam: resolved.home.name,
        awayTeam: resolved.away.name,
      };
    }
  }

  return {
    homeTeam: data?.home_team?.trim() || "Home",
    awayTeam: data?.away_team?.trim() || "Away",
  };
}

function fanLabel(count: number) {
  return count === 1 ? "fan" : "fans";
}

function messageLabel(count: number) {
  return count === 1 ? "message" : "messages";
}

/**
 * Pure builder for pulse copy. Keeps API responses honest and makes future
 * snapshot-based swings (halftime messages, post-goal reactions) easy to add.
 */
export function buildPulseItems(metrics: PulseMetrics, teams: TeamNames): PulseItem[] {
  const items: PulseItem[] = [];

  if (metrics.recentJoins > 0) {
    items.push({
      type: "presence",
      emoji: "🔥",
      text: `${metrics.recentJoins} ${fanLabel(metrics.recentJoins)} joined in the last 10 minutes`,
      priority: 90,
    });
  }

  if (metrics.recentMessages > 0) {
    items.push({
      type: "chat",
      emoji: "💬",
      text: `${metrics.recentMessages} ${messageLabel(metrics.recentMessages)} in the last 15 minutes`,
      priority: 80,
    });
  }

  const totalBacking = metrics.homeCount + metrics.awayCount;
  if (totalBacking > 0) {
    const recentTotal = metrics.recentHomeVotes + metrics.recentAwayVotes;
    const homeLeadingRecent = metrics.recentHomeVotes > metrics.recentAwayVotes;
    const awayLeadingRecent = metrics.recentAwayVotes > metrics.recentHomeVotes;

    if (recentTotal > 0 && (homeLeadingRecent || awayLeadingRecent)) {
      const climbingTeam = homeLeadingRecent ? teams.homeTeam : teams.awayTeam;
      items.push({
        type: "support",
        emoji: "📈",
        text: `${climbingTeam} support is climbing`,
        priority: 70,
      });
    } else if (totalBacking >= 2) {
      const homePct = Math.round((metrics.homeCount / totalBacking) * 100);
      const awayPct = 100 - homePct;
      const leaderTeam = homePct >= awayPct ? teams.homeTeam : teams.awayTeam;
      const leaderPct = Math.max(homePct, awayPct);

      if (leaderPct >= 55) {
        items.push({
          type: "support",
          emoji: "📊",
          text: `${leaderTeam} has ${leaderPct}% of the room`,
          priority: 60,
        });
      }
    }
  }

  // Lower-priority live watch signal when joins are quiet but fans are present.
  if (metrics.recentJoins === 0 && metrics.activeViewers > 0) {
    items.push({
      type: "presence",
      emoji: "👀",
      text: `${metrics.activeViewers} ${fanLabel(metrics.activeViewers)} are watching live`,
      priority: 50,
    });
  }

  // Future: moment pulses from score-change snapshots + post-goal chat/reaction spikes.
  // if (metrics.recentGoal) {
  //   items.push({ type: "moment", emoji: "⚽", text: "The room came alive after the goal", priority: 100 });
  // }

  return items.sort((left, right) => right.priority - left.priority).slice(0, PULSE_MAX_ITEMS);
}

export async function loadGameRoomPulse(
  admin: AdminClient,
  {
    gameId,
    roomCode,
    now = new Date(),
  }: {
    gameId: string;
    roomCode: string | null;
    now?: Date;
  },
): Promise<{ error: string | null; pulse: GameRoomPulseResponse | null }> {
  const presenceSinceIso = new Date(now.getTime() - PULSE_PRESENCE_WINDOW_MS).toISOString();
  const chatSinceIso = new Date(now.getTime() - PULSE_CHAT_WINDOW_MS).toISOString();
  const supportSinceIso = new Date(now.getTime() - PULSE_SUPPORT_RECENT_WINDOW_MS).toISOString();

  const [teams, recentJoins, recentMessages, activeViewersResult, rootingCounts, recentRooting] = await Promise.all([
    resolveTeamNames(admin, gameId),
    countRecentJoins(admin, gameId, roomCode, presenceSinceIso),
    countRecentMessages(admin, gameId, roomCode, chatSinceIso),
    getActiveViewerCount(admin, gameId, roomCode),
    getRootingCounts(admin, gameId, roomCode),
    countRecentRootingBySide(admin, gameId, roomCode, supportSinceIso),
  ]);

  if (rootingCounts.error) {
    return { error: rootingCounts.error, pulse: null };
  }

  const metrics: PulseMetrics = {
    recentJoins,
    recentMessages,
    activeViewers: activeViewersResult.count,
    homeCount: rootingCounts.counts?.homeCount ?? 0,
    awayCount: rootingCounts.counts?.awayCount ?? 0,
    recentHomeVotes: recentRooting.recentHomeVotes,
    recentAwayVotes: recentRooting.recentAwayVotes,
  };

  return {
    error: null,
    pulse: {
      gameId,
      generatedAt: now.toISOString(),
      items: buildPulseItems(metrics, teams),
    },
  };
}
