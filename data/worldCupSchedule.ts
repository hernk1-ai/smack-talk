export type WorldCupGroup = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "KO";

export type WorldCupMatch = {
  id: number;
  date: string;
  kickoffET: string;
  group: WorldCupGroup;
  homeTeam: string;
  awayTeam?: string;
  city: string;
  venue: string;
  stage: "Group Stage" | "Round of 32" | "Round of 16" | "Quarterfinal" | "Semifinal" | "Third Place" | "Final";
  status: "upcoming";
};

const EASTERN_TIME_OFFSET = "-04:00";

// Schedule data should be verified against current official sources before launch.
export const worldCupSchedule: WorldCupMatch[] = [
  { id: 1, date: "2026-06-11", kickoffET: "3:00 PM ET", group: "A", homeTeam: "Mexico", awayTeam: "South Africa", city: "Mexico City", venue: "Estadio Azteca", stage: "Group Stage", status: "upcoming" },
  { id: 2, date: "2026-06-12", kickoffET: "12:00 PM ET", group: "D", homeTeam: "United States", awayTeam: "Paraguay", city: "Los Angeles", venue: "SoFi Stadium", stage: "Group Stage", status: "upcoming" },
  { id: 3, date: "2026-06-12", kickoffET: "6:00 PM ET", group: "B", homeTeam: "Canada", awayTeam: "Switzerland", city: "Toronto", venue: "BMO Field", stage: "Group Stage", status: "upcoming" },
  { id: 4, date: "2026-06-13", kickoffET: "2:00 PM ET", group: "C", homeTeam: "Brazil", awayTeam: "Scotland", city: "New York", venue: "MetLife Stadium", stage: "Group Stage", status: "upcoming" },
  { id: 5, date: "2026-06-13", kickoffET: "9:00 PM ET", group: "E", homeTeam: "Germany", awayTeam: "Ecuador", city: "Dallas", venue: "AT&T Stadium", stage: "Group Stage", status: "upcoming" },
  { id: 6, date: "2026-06-14", kickoffET: "1:00 PM ET", group: "F", homeTeam: "Netherlands", awayTeam: "Japan", city: "Seattle", venue: "Lumen Field", stage: "Group Stage", status: "upcoming" },
  { id: 7, date: "2026-06-14", kickoffET: "4:00 PM ET", group: "G", homeTeam: "Belgium", awayTeam: "Iran", city: "Vancouver", venue: "BC Place", stage: "Group Stage", status: "upcoming" },
  { id: 8, date: "2026-06-14", kickoffET: "8:00 PM ET", group: "H", homeTeam: "Spain", awayTeam: "Uruguay", city: "Miami", venue: "Hard Rock Stadium", stage: "Group Stage", status: "upcoming" },
  { id: 9, date: "2026-06-15", kickoffET: "12:00 PM ET", group: "I", homeTeam: "France", awayTeam: "Senegal", city: "Boston", venue: "Gillette Stadium", stage: "Group Stage", status: "upcoming" },
  { id: 10, date: "2026-06-15", kickoffET: "3:00 PM ET", group: "J", homeTeam: "Argentina", awayTeam: "Austria", city: "Houston", venue: "NRG Stadium", stage: "Group Stage", status: "upcoming" },
  { id: 11, date: "2026-06-15", kickoffET: "6:00 PM ET", group: "K", homeTeam: "Portugal", awayTeam: "Colombia", city: "Atlanta", venue: "Mercedes-Benz Stadium", stage: "Group Stage", status: "upcoming" },
  { id: 12, date: "2026-06-15", kickoffET: "9:00 PM ET", group: "L", homeTeam: "England", awayTeam: "Croatia", city: "Philadelphia", venue: "Lincoln Financial Field", stage: "Group Stage", status: "upcoming" },
  { id: 13, date: "2026-06-16", kickoffET: "12:00 PM ET", group: "A", homeTeam: "South Korea", awayTeam: "Czechia", city: "Monterrey", venue: "Estadio BBVA", stage: "Group Stage", status: "upcoming" },
  { id: 14, date: "2026-06-16", kickoffET: "4:00 PM ET", group: "B", homeTeam: "Qatar", awayTeam: "Bosnia and Herzegovina", city: "Guadalajara", venue: "Estadio Akron", stage: "Group Stage", status: "upcoming" },
  { id: 15, date: "2026-06-17", kickoffET: "2:00 PM ET", group: "E", homeTeam: "Côte d'Ivoire", awayTeam: "Curaçao", city: "San Francisco", venue: "Levi's Stadium", stage: "Group Stage", status: "upcoming" },
  { id: 16, date: "2026-06-17", kickoffET: "8:00 PM ET", group: "D", homeTeam: "Australia", awayTeam: "Türkiye", city: "Kansas City", venue: "Arrowhead Stadium", stage: "Group Stage", status: "upcoming" },
  { id: 17, date: "2026-06-18", kickoffET: "1:00 PM ET", group: "G", homeTeam: "Egypt", awayTeam: "New Zealand", city: "Mexico City", venue: "Estadio Azteca", stage: "Group Stage", status: "upcoming" },
  { id: 18, date: "2026-06-18", kickoffET: "6:00 PM ET", group: "H", homeTeam: "Saudi Arabia", awayTeam: "Cabo Verde", city: "Los Angeles", venue: "SoFi Stadium", stage: "Group Stage", status: "upcoming" },
  { id: 19, date: "2026-06-19", kickoffET: "3:00 PM ET", group: "I", homeTeam: "Iraq", awayTeam: "Norway", city: "Dallas", venue: "AT&T Stadium", stage: "Group Stage", status: "upcoming" },
  { id: 20, date: "2026-06-19", kickoffET: "9:00 PM ET", group: "J", homeTeam: "Algeria", awayTeam: "Jordan", city: "Seattle", venue: "Lumen Field", stage: "Group Stage", status: "upcoming" },
  { id: 21, date: "2026-06-30", kickoffET: "2:00 PM ET", group: "KO", homeTeam: "Group A Winner", awayTeam: "Group B Runner-up", city: "Toronto", venue: "BMO Field", stage: "Round of 32", status: "upcoming" },
  { id: 22, date: "2026-07-03", kickoffET: "4:00 PM ET", group: "KO", homeTeam: "Round of 32 Winner", awayTeam: "Round of 32 Winner", city: "New York", venue: "MetLife Stadium", stage: "Round of 16", status: "upcoming" },
  { id: 23, date: "2026-07-08", kickoffET: "7:00 PM ET", group: "KO", homeTeam: "Quarterfinalist", awayTeam: "Quarterfinalist", city: "Miami", venue: "Hard Rock Stadium", stage: "Quarterfinal", status: "upcoming" },
  { id: 24, date: "2026-07-14", kickoffET: "8:00 PM ET", group: "KO", homeTeam: "Semifinal Winner", awayTeam: "Semifinal Winner", city: "New York", venue: "MetLife Stadium", stage: "Final", status: "upcoming" },
];

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
  // Assumption: schedule ET times are EDT (UTC-04:00) for pre-tournament dates.
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
