import { createClient } from "@/lib/supabase/client";
import { formatMatchupLabel } from "@/lib/worldCup/matchupDisplay";
import type { MatchPick } from "@/lib/supabase/types";

export type TournamentRecord = {
  wins: number;
  losses: number;
  draws: number;
};

export type RecentPickItem = {
  team: string;
  matchLabel: string;
  result: "hit" | "miss" | "pending" | "draw";
};

export type BackingActivityItem = {
  team: string;
  gameId: string;
  backedAt: string;
};

export function buildTournamentRecord(picks: MatchPick[]): TournamentRecord {
  const tournamentPicks = picks.filter((pick) => pick.winner_locked_at);

  return tournamentPicks.reduce(
    (record, pick) => {
      if (pick.winner_result === "hit") {
        record.wins += 1;
      } else if (pick.winner_result === "miss") {
        record.losses += 1;
      } else if (
        pick.status === "settled" &&
        pick.winner_result === "pending" &&
        pick.home_score !== null &&
        pick.away_score !== null &&
        pick.home_score === pick.away_score
      ) {
        record.draws += 1;
      }
      return record;
    },
    { wins: 0, losses: 0, draws: 0 },
  );
}

export function buildRecentPicks(picks: MatchPick[], limit = 5): RecentPickItem[] {
  return picks
    .filter((pick) => pick.winner_locked_at && pick.selected_winner)
    .slice(0, limit)
    .map((pick) => ({
      team: pick.selected_winner!,
      matchLabel: pick.away_team && pick.home_team ? formatMatchupLabel(pick.home_team, pick.away_team) : pick.match_id,
      result:
        pick.winner_result === "hit"
          ? "hit"
          : pick.winner_result === "miss"
            ? "miss"
            : pick.status === "settled"
              ? "draw"
              : "pending",
    }));
}

export async function getCurrentUserBackingActivity(limit = 8) {
  const supabase = createClient();

  if (!supabase) {
    return { items: [] as BackingActivityItem[], error: new Error("Supabase is not configured.") };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { items: [] as BackingActivityItem[], error: userError };
  }

  if (!user) {
    return { items: [] as BackingActivityItem[], error: new Error("Please sign in to view your backing activity.") };
  }

  const { data, error } = await supabase
    .from("match_rooting_votes")
    .select("game_id, team_key, updated_at, created_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { items: [] as BackingActivityItem[], error: error as Error };
  }

  const rows = data ?? [];
  const gameIds = [...new Set(rows.map((row) => row.game_id))];
  const gamesById = new Map<string, { home_team: string; away_team: string }>();

  if (gameIds.length) {
    const { data: games } = await supabase.from("games").select("id, home_team, away_team").in("id", gameIds);
    for (const game of games ?? []) {
      gamesById.set(game.id, { home_team: game.home_team, away_team: game.away_team });
    }
  }

  const items = rows.map((row) => {
    const game = gamesById.get(row.game_id);
    const team =
      game && row.team_key === "home"
        ? game.home_team
        : game && row.team_key === "away"
          ? game.away_team
          : row.team_key;

    return {
      team,
      gameId: row.game_id,
      backedAt: row.updated_at ?? row.created_at,
    };
  });

  return { items, error: null };
}
