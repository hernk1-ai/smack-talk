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

const TEAM_NAMES: Record<string, string> = {
  MEX: "Mexico",
  RSA: "South Africa",
  KOR: "Korea Republic",
  CZE: "Czechia",
  CAN: "Canada",
  BIH: "Bosnia and Herzegovina",
  QAT: "Qatar",
  SUI: "Switzerland",
  BRA: "Brazil",
  MAR: "Morocco",
  HAI: "Haiti",
  SCO: "Scotland",
  USA: "United States",
  PAR: "Paraguay",
  AUS: "Australia",
  TUR: "Türkiye",
  GER: "Germany",
  CUW: "Curaçao",
  CIV: "Côte d'Ivoire",
  ECU: "Ecuador",
  NED: "Netherlands",
  JPN: "Japan",
  SWE: "Sweden",
  TUN: "Tunisia",
  BEL: "Belgium",
  EGY: "Egypt",
  IRN: "IR Iran",
  NZL: "New Zealand",
  ESP: "Spain",
  CPV: "Cabo Verde",
  KSA: "Saudi Arabia",
  URU: "Uruguay",
  FRA: "France",
  SEN: "Senegal",
  IRQ: "Iraq",
  NOR: "Norway",
  ARG: "Argentina",
  ALG: "Algeria",
  AUT: "Austria",
  JOR: "Jordan",
  POR: "Portugal",
  COD: "DR Congo",
  UZB: "Uzbekistan",
  COL: "Colombia",
  GHA: "Ghana",
  PAN: "Panama",
  ENG: "England",
  CRO: "Croatia",
};

type RawFixture = {
  id: number;
  date: string;
  time: string;
  group: WorldCupGroup;
  stage: WorldCupMatch["stage"];
  home: string;
  away: string;
  city?: string;
  venue?: string;
  country?: string;
};

// FIFA-backed fixtures using official match numbers, pairings/slots, and ET kickoffs.
// Where FIFA publications do not clearly expose a field in this integration path, value remains "TBD".
const RAW_FIXTURES: RawFixture[] = [
  // Group stage (1-72)
  f(1, "2026-06-11", "3:00 PM ET", "A", "Group Stage", "MEX", "RSA", "Mexico City", "Mexico City Stadium", "Mexico"),
  f(2, "2026-06-11", "10:00 PM ET", "A", "Group Stage", "KOR", "CZE", "Guadalajara", "Estadio Guadalajara", "Mexico"),
  f(3, "2026-06-12", "3:00 PM ET", "B", "Group Stage", "CAN", "BIH", "Toronto", "Toronto Stadium", "Canada"),
  f(4, "2026-06-12", "9:00 PM ET", "D", "Group Stage", "USA", "PAR", "Los Angeles", "Los Angeles Stadium", "United States"),
  f(5, "2026-06-13", "9:00 PM ET", "C", "Group Stage", "HAI", "SCO", "Boston", "Boston Stadium", "United States"),
  f(6, "2026-06-13", "12:00 AM ET", "D", "Group Stage", "AUS", "TUR", "Vancouver", "BC Place Vancouver", "Canada"),
  f(7, "2026-06-13", "6:00 PM ET", "C", "Group Stage", "BRA", "MAR", "New York / New Jersey", "New York New Jersey Stadium", "United States"),
  f(8, "2026-06-13", "3:00 PM ET", "B", "Group Stage", "QAT", "SUI", "San Francisco Bay Area", "San Francisco Bay Area Stadium", "United States"),
  f(9, "2026-06-14", "7:00 PM ET", "E", "Group Stage", "CIV", "ECU", "Philadelphia", "Philadelphia Stadium", "United States"),
  f(10, "2026-06-14", "1:00 PM ET", "E", "Group Stage", "GER", "CUW", "Houston", "Houston Stadium", "United States"),
  f(11, "2026-06-14", "4:00 PM ET", "F", "Group Stage", "NED", "JPN", "Dallas", "Dallas Stadium", "United States"),
  f(12, "2026-06-14", "10:00 PM ET", "F", "Group Stage", "SWE", "TUN", "Monterrey", "Estadio Monterrey", "Mexico"),
  f(13, "2026-06-15", "6:00 PM ET", "H", "Group Stage", "KSA", "URU", "Miami", "Miami Stadium", "United States"),
  f(14, "2026-06-15", "12:00 PM ET", "H", "Group Stage", "ESP", "CPV", "Atlanta", "Atlanta Stadium", "United States"),
  f(15, "2026-06-15", "9:00 PM ET", "G", "Group Stage", "IRN", "NZL", "Los Angeles", "Los Angeles Stadium", "United States"),
  f(16, "2026-06-15", "3:00 PM ET", "G", "Group Stage", "BEL", "EGY", "Seattle", "Seattle Stadium", "United States"),
  f(17, "2026-06-16", "3:00 PM ET", "I", "Group Stage", "FRA", "SEN", "New York / New Jersey", "New York New Jersey Stadium", "United States"),
  f(18, "2026-06-16", "6:00 PM ET", "I", "Group Stage", "IRQ", "NOR", "Boston", "Boston Stadium", "United States"),
  f(19, "2026-06-16", "9:00 PM ET", "J", "Group Stage", "ARG", "ALG", "Kansas City", "Kansas City Stadium", "United States"),
  f(20, "2026-06-16", "12:00 AM ET", "J", "Group Stage", "AUT", "JOR", "San Francisco Bay Area", "San Francisco Bay Area Stadium", "United States"),
  f(21, "2026-06-17", "7:00 PM ET", "L", "Group Stage", "GHA", "PAN", "Toronto", "Toronto Stadium", "Canada"),
  f(22, "2026-06-17", "4:00 PM ET", "L", "Group Stage", "ENG", "CRO", "Dallas", "Dallas Stadium", "United States"),
  f(23, "2026-06-17", "1:00 PM ET", "K", "Group Stage", "POR", "COD", "Houston", "Houston Stadium", "United States"),
  f(24, "2026-06-17", "10:00 PM ET", "K", "Group Stage", "UZB", "COL", "Mexico City", "Mexico City Stadium", "Mexico"),
  f(25, "2026-06-18", "12:00 PM ET", "A", "Group Stage", "CZE", "RSA", "Atlanta", "Atlanta Stadium", "United States"),
  f(26, "2026-06-18", "3:00 PM ET", "B", "Group Stage", "SUI", "BIH", "Los Angeles", "Los Angeles Stadium", "United States"),
  f(27, "2026-06-18", "6:00 PM ET", "B", "Group Stage", "CAN", "QAT", "Vancouver", "BC Place Vancouver", "Canada"),
  f(28, "2026-06-18", "9:00 PM ET", "A", "Group Stage", "MEX", "KOR", "Guadalajara", "Estadio Guadalajara", "Mexico"),
  f(29, "2026-06-19", "8:30 PM ET", "C", "Group Stage", "BRA", "HAI", "Philadelphia", "Philadelphia Stadium", "United States"),
  f(30, "2026-06-19", "6:00 PM ET", "C", "Group Stage", "SCO", "MAR", "Boston", "Boston Stadium", "United States"),
  f(31, "2026-06-19", "11:00 PM ET", "D", "Group Stage", "CZE", "MEX", "San Francisco Bay Area", "San Francisco Bay Area Stadium", "United States"),
  f(32, "2026-06-19", "3:00 PM ET", "D", "Group Stage", "USA", "AUS", "Seattle", "Seattle Stadium", "United States"),
  f(33, "2026-06-20", "4:00 PM ET", "E", "Group Stage", "GER", "CIV", "Toronto", "Toronto Stadium", "Canada"),
  f(34, "2026-06-20", "8:00 PM ET", "E", "Group Stage", "ECU", "CUW", "Kansas City", "Kansas City Stadium", "United States"),
  f(35, "2026-06-20", "1:00 PM ET", "F", "Group Stage", "NED", "SWE", "Houston", "Houston Stadium", "United States"),
  f(36, "2026-06-20", "12:00 AM ET", "F", "Group Stage", "TUN", "JPN", "Monterrey", "Estadio Monterrey", "Mexico"),
  f(37, "2026-06-21", "6:00 PM ET", "H", "Group Stage", "URU", "CPV", "Miami", "Miami Stadium", "United States"),
  f(38, "2026-06-21", "12:00 PM ET", "H", "Group Stage", "ESP", "KSA", "Atlanta", "Atlanta Stadium", "United States"),
  f(39, "2026-06-21", "3:00 PM ET", "G", "Group Stage", "BEL", "IRN", "Los Angeles", "Los Angeles Stadium", "United States"),
  f(40, "2026-06-21", "9:00 PM ET", "G", "Group Stage", "NZL", "EGY", "Vancouver", "BC Place Vancouver", "Canada"),
  f(41, "2026-06-22", "8:00 PM ET", "I", "Group Stage", "NOR", "SEN", "New York / New Jersey", "New York New Jersey Stadium", "United States"),
  f(42, "2026-06-22", "5:00 PM ET", "I", "Group Stage", "FRA", "IRQ", "Philadelphia", "Philadelphia Stadium", "United States"),
  f(43, "2026-06-22", "1:00 PM ET", "J", "Group Stage", "ARG", "AUT", "Dallas", "Dallas Stadium", "United States"),
  f(44, "2026-06-22", "11:00 PM ET", "J", "Group Stage", "JOR", "ALG", "San Francisco Bay Area", "San Francisco Bay Area Stadium", "United States"),
  f(45, "2026-06-23", "4:00 PM ET", "L", "Group Stage", "ENG", "GHA", "Boston", "Boston Stadium", "United States"),
  f(46, "2026-06-23", "7:00 PM ET", "L", "Group Stage", "PAN", "CRO", "Toronto", "Toronto Stadium", "Canada"),
  f(47, "2026-06-23", "1:00 PM ET", "K", "Group Stage", "POR", "UZB", "Houston", "Houston Stadium", "United States"),
  f(48, "2026-06-23", "10:00 PM ET", "K", "Group Stage", "COL", "COD", "Guadalajara", "Estadio Guadalajara", "Mexico"),
  f(49, "2026-06-24", "6:00 PM ET", "C", "Group Stage", "SCO", "BRA"),
  f(50, "2026-06-24", "6:00 PM ET", "C", "Group Stage", "MAR", "HAI"),
  f(51, "2026-06-24", "3:00 PM ET", "B", "Group Stage", "SUI", "CAN"),
  f(52, "2026-06-24", "3:00 PM ET", "B", "Group Stage", "BIH", "QAT"),
  f(53, "2026-06-24", "9:00 PM ET", "A", "Group Stage", "CZE", "MEX"),
  f(54, "2026-06-24", "9:00 PM ET", "A", "Group Stage", "RSA", "KOR"),
  f(55, "2026-06-25", "4:00 PM ET", "E", "Group Stage", "CUW", "CIV", "Philadelphia", "Philadelphia Stadium", "United States"),
  f(56, "2026-06-25", "4:00 PM ET", "E", "Group Stage", "ECU", "GER", "New York / New Jersey", "New York New Jersey Stadium", "United States"),
  f(57, "2026-06-25", "7:00 PM ET", "F", "Group Stage", "JPN", "SWE", "Dallas", "Dallas Stadium", "United States"),
  f(58, "2026-06-25", "7:00 PM ET", "F", "Group Stage", "TUN", "NED", "Kansas City", "Kansas City Stadium", "United States"),
  f(59, "2026-06-25", "10:00 PM ET", "D", "Group Stage", "TUR", "USA", "Los Angeles", "Los Angeles Stadium", "United States"),
  f(60, "2026-06-25", "10:00 PM ET", "D", "Group Stage", "PAR", "AUS", "San Francisco Bay Area", "San Francisco Bay Area Stadium", "United States"),
  f(61, "2026-06-26", "3:00 PM ET", "I", "Group Stage", "NOR", "FRA", "Boston", "Boston Stadium", "United States"),
  f(62, "2026-06-26", "3:00 PM ET", "I", "Group Stage", "SEN", "IRQ", "Toronto", "Toronto Stadium", "Canada"),
  f(63, "2026-06-26", "11:00 PM ET", "G", "Group Stage", "EGY", "IRN", "Seattle", "Seattle Stadium", "United States"),
  f(64, "2026-06-26", "11:00 PM ET", "G", "Group Stage", "NZL", "BEL", "Vancouver", "BC Place Vancouver", "Canada"),
  f(65, "2026-06-26", "8:00 PM ET", "H", "Group Stage", "CPV", "KSA", "Houston", "Houston Stadium", "United States"),
  f(66, "2026-06-26", "8:00 PM ET", "H", "Group Stage", "URU", "ESP", "Guadalajara", "Estadio Guadalajara", "Mexico"),
  f(67, "2026-06-27", "5:00 PM ET", "L", "Group Stage", "PAN", "ENG", "New York / New Jersey", "New York New Jersey Stadium", "United States"),
  f(68, "2026-06-27", "5:00 PM ET", "L", "Group Stage", "CRO", "GHA", "Philadelphia", "Philadelphia Stadium", "United States"),
  f(69, "2026-06-27", "10:00 PM ET", "J", "Group Stage", "ALG", "AUT", "Kansas City", "Kansas City Stadium", "United States"),
  f(70, "2026-06-27", "10:00 PM ET", "J", "Group Stage", "JOR", "ARG", "Dallas", "Dallas Stadium", "United States"),
  f(71, "2026-06-27", "7:30 PM ET", "K", "Group Stage", "COL", "POR", "Miami", "Miami Stadium", "United States"),
  f(72, "2026-06-27", "7:30 PM ET", "K", "Group Stage", "COD", "UZB", "Atlanta", "Atlanta Stadium", "United States"),

  // Knockout (73-104)
  f(73, "2026-06-28", "3:00 PM ET", "KO", "Round of 32", "2A", "2B", "Los Angeles", "Los Angeles Stadium", "United States"),
  f(74, "2026-06-29", "4:30 PM ET", "KO", "Round of 32", "1E", "3ABCDF", "Boston", "Boston Stadium", "United States"),
  f(75, "2026-06-29", "9:00 PM ET", "KO", "Round of 32", "1F", "2C", "Monterrey", "Estadio Monterrey", "Mexico"),
  f(76, "2026-06-29", "1:00 PM ET", "KO", "Round of 32", "1C", "2F", "Houston", "Houston Stadium", "United States"),
  f(77, "2026-06-30", "5:00 PM ET", "KO", "Round of 32", "1I", "3CDFGH", "New York / New Jersey", "New York New Jersey Stadium", "United States"),
  f(78, "2026-06-30", "1:00 PM ET", "KO", "Round of 32", "2E", "2I", "Dallas", "Dallas Stadium", "United States"),
  f(79, "2026-06-30", "9:00 PM ET", "KO", "Round of 32", "1A", "3CEFHI", "Mexico City", "Mexico City Stadium", "Mexico"),
  f(80, "2026-07-01", "12:00 PM ET", "KO", "Round of 32", "1L", "3EHIJK", "Atlanta", "Atlanta Stadium", "United States"),
  f(81, "2026-07-01", "8:00 PM ET", "KO", "Round of 32", "1D", "3BEFIJ", "San Francisco Bay Area", "San Francisco Bay Area Stadium", "United States"),
  f(82, "2026-07-01", "4:00 PM ET", "KO", "Round of 32", "1G", "3AEHIJ", "Seattle", "Seattle Stadium", "United States"),
  f(83, "2026-07-02", "7:00 PM ET", "KO", "Round of 32", "2K", "2L", "Toronto", "Toronto Stadium", "Canada"),
  f(84, "2026-07-02", "3:00 PM ET", "KO", "Round of 32", "1H", "2J", "Los Angeles", "Los Angeles Stadium", "United States"),
  f(85, "2026-07-02", "11:00 PM ET", "KO", "Round of 32", "1B", "3EFGIJ", "Vancouver", "BC Place Vancouver", "Canada"),
  f(86, "2026-07-03", "6:00 PM ET", "KO", "Round of 32", "1J", "2H", "Miami", "Miami Stadium", "United States"),
  f(87, "2026-07-03", "9:30 PM ET", "KO", "Round of 32", "1K", "3DEIJL", "Kansas City", "Kansas City Stadium", "United States"),
  f(88, "2026-07-03", "2:00 PM ET", "KO", "Round of 32", "2D", "2G", "Dallas", "Dallas Stadium", "United States"),
  f(89, "2026-07-04", "5:00 PM ET", "KO", "Round of 16", "W74", "W77", "Philadelphia", "Philadelphia Stadium", "United States"),
  f(90, "2026-07-04", "1:00 PM ET", "KO", "Round of 16", "W73", "W75", "Houston", "Houston Stadium", "United States"),
  f(91, "2026-07-05", "4:00 PM ET", "KO", "Round of 16", "W76", "W78", "New York / New Jersey", "New York New Jersey Stadium", "United States"),
  f(92, "2026-07-05", "8:00 PM ET", "KO", "Round of 16", "W79", "W80", "Mexico City", "Mexico City Stadium", "Mexico"),
  f(93, "2026-07-06", "3:00 PM ET", "KO", "Round of 16", "W83", "W84", "Dallas", "Dallas Stadium", "United States"),
  f(94, "2026-07-06", "8:00 PM ET", "KO", "Round of 16", "W81", "W82", "Seattle", "Seattle Stadium", "United States"),
  f(95, "2026-07-07", "12:00 PM ET", "KO", "Round of 16", "W86", "W88", "Atlanta", "Atlanta Stadium", "United States"),
  f(96, "2026-07-07", "4:00 PM ET", "KO", "Round of 16", "W85", "W87", "Vancouver", "BC Place Vancouver", "Canada"),
  f(97, "2026-07-09", "4:00 PM ET", "KO", "Quarterfinal", "W89", "W90", "Boston", "Boston Stadium", "United States"),
  f(98, "2026-07-10", "3:00 PM ET", "KO", "Quarterfinal", "W93", "W94", "Los Angeles", "Los Angeles Stadium", "United States"),
  f(99, "2026-07-11", "5:00 PM ET", "KO", "Quarterfinal", "W91", "W92", "Miami", "Miami Stadium", "United States"),
  f(100, "2026-07-11", "9:00 PM ET", "KO", "Quarterfinal", "W95", "W96", "Kansas City", "Kansas City Stadium", "United States"),
  f(101, "2026-07-14", "3:00 PM ET", "KO", "Semifinal", "W97", "W98", "Dallas", "Dallas Stadium", "United States"),
  f(102, "2026-07-15", "3:00 PM ET", "KO", "Semifinal", "W99", "W100", "Atlanta", "Atlanta Stadium", "United States"),
  f(103, "2026-07-18", "5:00 PM ET", "KO", "Third Place", "L101", "L102", "Miami", "Miami Stadium", "United States"),
  f(104, "2026-07-19", "3:00 PM ET", "KO", "Final", "W101", "W102", "New York / New Jersey", "New York New Jersey Stadium", "United States"),
];

function f(
  id: number,
  date: string,
  kickoffET: string,
  group: WorldCupGroup,
  stage: WorldCupMatch["stage"],
  home: string,
  away: string,
  city = "TBD",
  venue = "TBD",
  country = "TBD",
): RawFixture {
  return { id, date, time: kickoffET, group, stage, home, away, city, venue, country };
}

export const worldCupSchedule: WorldCupMatch[] = RAW_FIXTURES.map((item) => ({
  id: item.id,
  matchNumber: item.id,
  date: item.date,
  kickoffTime: item.time,
  kickoffET: item.time,
  timezone: "ET",
  group: item.group,
  homeTeam: expandTeam(item.home),
  awayTeam: expandTeam(item.away),
  city: item.city ?? "TBD",
  venue: item.venue ?? "TBD",
  country: item.country ?? "TBD",
  stage: item.stage,
  status: "upcoming",
  sourceUrl: OFFICIAL_SOURCE_URL,
}));

function expandTeam(token: string) {
  if (TEAM_NAMES[token]) {
    return TEAM_NAMES[token];
  }

  // Keep official FIFA bracket slot labels as-is (e.g. 2A, W97, 3ABCDF, L101).
  return token;
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
