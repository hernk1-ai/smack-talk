export type WorldCupGroup = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "KO";

export type WorldCupMatch = {
  id: number;
  matchNumber: number;
  date: string;
  kickoffTime: string;
  kickoffET: string;
  timezone: "ET";
  group: WorldCupGroup;
  homeTeam: string;
  awayTeam?: string;
  city: string;
  venue: string;
  country: string;
  stage: "Group Stage" | "Round of 32" | "Round of 16" | "Quarterfinal" | "Semifinal" | "Third Place" | "Final";
  status: "upcoming";
  sourceUrl: string;
};

const EASTERN_TIME_OFFSET = "-04:00";
const OFFICIAL_SOURCE_URL = "https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures?country=US&wtw-filter=ALL";
const OFFICIAL_PDF_SOURCE_URL = "https://digitalhub.fifa.com/asset/4b5d4417-3343-4732-9cdf-14b6662af407/FWC26-Match-Schedule_English.pdf";

// Fixture data is sourced from FIFA's official World Cup 2026 schedule pages.
// Keep "TBD" placeholders when FIFA has not finalized details.
export const worldCupSchedule: WorldCupMatch[] = [
  fixture(1, "2026-06-11", "3:00 PM ET", "A", "Mexico", "South Africa", "Mexico City", "Mexico City Stadium", "Mexico"),
  fixture(2, "2026-06-11", "10:00 PM ET", "A", "Korea Republic", "Czechia", "Guadalajara", "Estadio Guadalajara", "Mexico"),
  fixture(3, "2026-06-12", "3:00 PM ET", "B", "Canada", "Bosnia and Herzegovina", "Toronto", "Toronto Stadium", "Canada"),
  fixture(4, "2026-06-12", "9:00 PM ET", "D", "USA", "Paraguay", "Los Angeles", "Los Angeles Stadium", "United States"),
  fixture(5, "2026-06-13", "9:00 PM ET", "B", "Qatar", "Switzerland", "San Francisco Bay Area", "San Francisco Bay Area Stadium", "United States"),
  fixture(6, "2026-06-13", "12:00 AM ET", "D", "Australia", "Türkiye", "Vancouver", "BC Place Vancouver", "Canada"),
  fixture(7, "2026-06-13", "6:00 PM ET", "C", "Brazil", "Morocco", "New York New Jersey", "New York New Jersey Stadium", "United States"),
  fixture(8, "2026-06-13", "3:00 PM ET", "C", "Haiti", "Scotland", "Boston", "Boston Stadium", "United States"),
  fixture(9, "2026-06-14", "7:00 PM ET", "E", "Côte d'Ivoire", "Ecuador", "Philadelphia", "Philadelphia Stadium", "United States"),
  fixture(10, "2026-06-14", "1:00 PM ET", "E", "Germany", "Curaçao", "Houston", "Houston Stadium", "United States"),
  fixture(11, "2026-06-14", "4:00 PM ET", "F", "Netherlands", "Japan", "Dallas", "Dallas Stadium", "United States"),
  fixture(12, "2026-06-14", "10:00 PM ET", "F", "Sweden", "Tunisia", "Monterrey", "Estadio Monterrey", "Mexico"),
  fixture(13, "2026-06-15", "6:00 PM ET", "H", "Saudi Arabia", "Uruguay", "Miami", "Miami Stadium", "United States"),
  fixture(14, "2026-06-15", "12:00 PM ET", "H", "Spain", "Cabo Verde", "Atlanta", "Atlanta Stadium", "United States"),
  fixture(15, "2026-06-15", "9:00 PM ET", "G", "IR Iran", "New Zealand", "Los Angeles", "Los Angeles Stadium", "United States"),
  fixture(16, "2026-06-15", "3:00 PM ET", "G", "Belgium", "Egypt", "Seattle", "Seattle Stadium", "United States"),
  fixture(17, "2026-06-16", "3:00 PM ET", "I", "France", "Senegal", "New York New Jersey", "New York New Jersey Stadium", "United States"),
  fixture(18, "2026-06-16", "6:00 PM ET", "I", "Iraq", "Norway", "Boston", "Boston Stadium", "United States"),
  fixture(19, "2026-06-16", "9:00 PM ET", "J", "Argentina", "Algeria", "Kansas City", "Kansas City Stadium", "United States"),
  fixture(20, "2026-06-16", "12:00 AM ET", "J", "Austria", "Jordan", "San Francisco Bay Area", "San Francisco Bay Area Stadium", "United States"),
  fixture(21, "2026-06-17", "3:00 PM ET", "L", "Ghana", "Panama", "Toronto", "Toronto Stadium", "Canada"),
  fixture(22, "2026-06-17", "4:00 PM ET", "L", "England", "Croatia", "Dallas", "Dallas Stadium", "United States"),
  fixture(23, "2026-06-17", "1:00 PM ET", "K", "Portugal", "DR Congo", "Houston", "Houston Stadium", "United States"),
  fixture(24, "2026-06-17", "10:00 PM ET", "K", "Uzbekistan", "Colombia", "Mexico City", "Mexico City Stadium", "Mexico"),
];

function fixture(
  matchNumber: number,
  date: string,
  kickoffET: string,
  group: WorldCupGroup,
  homeTeam: string,
  awayTeam: string,
  city: string,
  venue: string,
  country: string,
): WorldCupMatch {
  return {
    id: matchNumber,
    matchNumber,
    date,
    kickoffTime: kickoffET,
    kickoffET,
    timezone: "ET",
    group,
    homeTeam,
    awayTeam,
    city,
    venue,
    country,
    stage: "Group Stage",
    status: "upcoming",
    sourceUrl: OFFICIAL_SOURCE_URL,
  };
}

export function getWorldCupFixtureSourceUrls() {
  return {
    page: OFFICIAL_SOURCE_URL,
    pdf: OFFICIAL_PDF_SOURCE_URL,
  };
}

export function getWorldCupMatchById(matchId: number | string) {
  const normalizedId = typeof matchId === "string" ? Number.parseInt(matchId, 10) : matchId;
  if (!Number.isFinite(normalizedId)) {
    return null;
  }

  return worldCupSchedule.find((match) => match.id === normalizedId) ?? null;
}

export function getWorldCupMatchId(match: WorldCupMatch) {
  return `wc-2026-${match.id}`;
}

export function getWorldCupKickoffIso(match: WorldCupMatch) {
  const parsed = parseEtTime(match.kickoffET);
  if (!parsed) {
    return null;
  }

  const hours = String(parsed.hours24).padStart(2, "0");
  const minutes = String(parsed.minutes).padStart(2, "0");
  return `${match.date}T${hours}:${minutes}:00${EASTERN_TIME_OFFSET}`;
}

export function isWorldCupMatchLocked(match: WorldCupMatch, now = new Date()) {
  const kickoffIso = getWorldCupKickoffIso(match);
  if (!kickoffIso) {
    return false;
  }

  return now.getTime() >= new Date(kickoffIso).getTime();
}

function parseEtTime(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)\s*ET$/i);
  if (!match) {
    return null;
  }

  const hourRaw = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  const suffix = match[3].toUpperCase();

  if (!Number.isFinite(hourRaw) || !Number.isFinite(minutes) || hourRaw < 1 || hourRaw > 12 || minutes < 0 || minutes > 59) {
    return null;
  }

  const hours24 = suffix === "PM" ? (hourRaw === 12 ? 12 : hourRaw + 12) : hourRaw === 12 ? 0 : hourRaw;

  return {
    hours24,
    minutes,
  };
}
