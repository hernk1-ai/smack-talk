import type { Database } from "@/lib/supabase/types";

type GameInsert = Database["public"]["Tables"]["games"]["Insert"];

type EspnScoreboard = {
  events?: EspnEvent[];
};

type EspnEvent = {
  id?: string;
  date?: string;
  name?: string;
  shortName?: string;
  status?: {
    type?: {
      state?: string;
      completed?: boolean;
    };
    period?: number;
    displayClock?: string;
  };
  competitions?: Array<{
    competitors?: EspnCompetitor[];
  }>;
};

type EspnCompetitor = {
  homeAway?: "home" | "away";
  score?: string;
  team?: {
    abbreviation?: string;
    shortDisplayName?: string;
  };
};

export const ESPN_NBA_SCOREBOARD_URL = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";

export async function fetchEspnNbaGames(date?: string) {
  const url = new URL(ESPN_NBA_SCOREBOARD_URL);

  if (date) {
    url.searchParams.set("dates", date);
  }

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
    },
    next: {
      revalidate: 60,
    },
  });

  if (!response.ok) {
    throw new Error(`ESPN NBA scoreboard returned ${response.status}`);
  }

  const scoreboard = (await response.json()) as EspnScoreboard;

  return normalizeEspnNbaGames(scoreboard);
}

export function normalizeEspnNbaGames(scoreboard: EspnScoreboard): GameInsert[] {
  const games: GameInsert[] = [];

  for (const event of scoreboard.events ?? []) {
      const competition = event.competitions?.[0];
      const home = competition?.competitors?.find((competitor) => competitor.homeAway === "home");
      const away = competition?.competitors?.find((competitor) => competitor.homeAway === "away");

      if (!event.id || !home?.team || !away?.team) {
        continue;
      }

      const status = normalizeStatus(event.status?.type?.state, event.status?.type?.completed);
      const period = status === "scheduled" ? null : formatPeriod(event.status?.period);

      games.push({
        id: `espn-nba-${event.id}`,
        external_game_id: event.id,
        league: "NBA",
        sport: "basketball",
        away_team: away.team.abbreviation ?? away.team.shortDisplayName ?? "AWAY",
        home_team: home.team.abbreviation ?? home.team.shortDisplayName ?? "HOME",
        away_score: Number(away.score ?? 0),
        home_score: Number(home.score ?? 0),
        period,
        clock: status === "scheduled" ? null : event.status?.displayClock ?? null,
        status,
        starts_at: event.date ?? null,
        ended_at: status === "final" ? new Date().toISOString() : null,
        watching_count: 0,
        ride_count: 0,
        fade_count: 0,
        heat: 0,
        event_slug: makeEventSlug(event.name ?? event.shortName ?? "nba-game"),
        event_name: event.name ?? event.shortName ?? "NBA Game",
      });
  }

  return games;
}

function normalizeStatus(state?: string, completed?: boolean): "scheduled" | "live" | "final" {
  if (completed || state === "post") {
    return "final";
  }

  if (state === "in") {
    return "live";
  }

  return "scheduled";
}

function formatPeriod(period?: number) {
  if (!period) {
    return null;
  }

  if (period <= 4) {
    return `Q${period}`;
  }

  return `OT${period - 4}`;
}

function makeEventSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}
