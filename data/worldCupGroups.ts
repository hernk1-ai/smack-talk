export type WorldCupGroupKey =
  | "Group A"
  | "Group B"
  | "Group C"
  | "Group D"
  | "Group E"
  | "Group F"
  | "Group G"
  | "Group H"
  | "Group I"
  | "Group J"
  | "Group K"
  | "Group L";

export type WorldCupTeam = {
  name: string;
  code: string;
  flag: string;
  confederation: "AFC" | "CAF" | "CONCACAF" | "CONMEBOL" | "UEFA" | "OFC";
};

export const worldCupGroupOrder: WorldCupGroupKey[] = [
  "Group A",
  "Group B",
  "Group C",
  "Group D",
  "Group E",
  "Group F",
  "Group G",
  "Group H",
  "Group I",
  "Group J",
  "Group K",
  "Group L",
];

// World Cup MVP onboarding seed set.
// Keep centralized so we can swap with official final groups later.
export const worldCupGroups: Record<WorldCupGroupKey, WorldCupTeam[]> = {
  "Group A": [
    { name: "Mexico", code: "MEX", flag: "🇲🇽", confederation: "CONCACAF" },
    { name: "South Korea", code: "KOR", flag: "🇰🇷", confederation: "AFC" },
    { name: "South Africa", code: "RSA", flag: "🇿🇦", confederation: "CAF" },
    { name: "Czechia", code: "CZE", flag: "🇨🇿", confederation: "UEFA" },
  ],
  "Group B": [
    { name: "Canada", code: "CAN", flag: "🇨🇦", confederation: "CONCACAF" },
    { name: "Bosnia and Herzegovina", code: "BIH", flag: "🇧🇦", confederation: "UEFA" },
    { name: "Qatar", code: "QAT", flag: "🇶🇦", confederation: "AFC" },
    { name: "Switzerland", code: "SUI", flag: "🇨🇭", confederation: "UEFA" },
  ],
  "Group C": [
    { name: "Brazil", code: "BRA", flag: "🇧🇷", confederation: "CONMEBOL" },
    { name: "Morocco", code: "MAR", flag: "🇲🇦", confederation: "CAF" },
    { name: "Haiti", code: "HAI", flag: "🇭🇹", confederation: "CONCACAF" },
    { name: "Scotland", code: "SCO", flag: "🇬🇧", confederation: "UEFA" },
  ],
  "Group D": [
    { name: "United States", code: "USA", flag: "🇺🇸", confederation: "CONCACAF" },
    { name: "Paraguay", code: "PAR", flag: "🇵🇾", confederation: "CONMEBOL" },
    { name: "Australia", code: "AUS", flag: "🇦🇺", confederation: "AFC" },
    { name: "Türkiye", code: "TUR", flag: "🇹🇷", confederation: "UEFA" },
  ],
  "Group E": [
    { name: "Germany", code: "GER", flag: "🇩🇪", confederation: "UEFA" },
    { name: "Curaçao", code: "CUW", flag: "🇨🇼", confederation: "CONCACAF" },
    { name: "Côte d'Ivoire", code: "CIV", flag: "🇨🇮", confederation: "CAF" },
    { name: "Ecuador", code: "ECU", flag: "🇪🇨", confederation: "CONMEBOL" },
  ],
  "Group F": [
    { name: "Netherlands", code: "NED", flag: "🇳🇱", confederation: "UEFA" },
    { name: "Japan", code: "JPN", flag: "🇯🇵", confederation: "AFC" },
    { name: "Sweden", code: "SWE", flag: "🇸🇪", confederation: "UEFA" },
    { name: "Tunisia", code: "TUN", flag: "🇹🇳", confederation: "CAF" },
  ],
  "Group G": [
    { name: "Belgium", code: "BEL", flag: "🇧🇪", confederation: "UEFA" },
    { name: "Egypt", code: "EGY", flag: "🇪🇬", confederation: "CAF" },
    { name: "Iran", code: "IRN", flag: "🇮🇷", confederation: "AFC" },
    { name: "New Zealand", code: "NZL", flag: "🇳🇿", confederation: "OFC" },
  ],
  "Group H": [
    { name: "Spain", code: "ESP", flag: "🇪🇸", confederation: "UEFA" },
    { name: "Cabo Verde", code: "CPV", flag: "🇨🇻", confederation: "CAF" },
    { name: "Saudi Arabia", code: "KSA", flag: "🇸🇦", confederation: "AFC" },
    { name: "Uruguay", code: "URU", flag: "🇺🇾", confederation: "CONMEBOL" },
  ],
  "Group I": [
    { name: "France", code: "FRA", flag: "🇫🇷", confederation: "UEFA" },
    { name: "Senegal", code: "SEN", flag: "🇸🇳", confederation: "CAF" },
    { name: "Iraq", code: "IRQ", flag: "🇮🇶", confederation: "AFC" },
    { name: "Norway", code: "NOR", flag: "🇳🇴", confederation: "UEFA" },
  ],
  "Group J": [
    { name: "Argentina", code: "ARG", flag: "🇦🇷", confederation: "CONMEBOL" },
    { name: "Algeria", code: "ALG", flag: "🇩🇿", confederation: "CAF" },
    { name: "Austria", code: "AUT", flag: "🇦🇹", confederation: "UEFA" },
    { name: "Jordan", code: "JOR", flag: "🇯🇴", confederation: "AFC" },
  ],
  "Group K": [
    { name: "Portugal", code: "POR", flag: "🇵🇹", confederation: "UEFA" },
    { name: "DR Congo", code: "COD", flag: "🇨🇩", confederation: "CAF" },
    { name: "Uzbekistan", code: "UZB", flag: "🇺🇿", confederation: "AFC" },
    { name: "Colombia", code: "COL", flag: "🇨🇴", confederation: "CONMEBOL" },
  ],
  "Group L": [
    { name: "England", code: "ENG", flag: "🇬🇧", confederation: "UEFA" },
    { name: "Croatia", code: "CRO", flag: "🇭🇷", confederation: "UEFA" },
    { name: "Ghana", code: "GHA", flag: "🇬🇭", confederation: "CAF" },
    { name: "Panama", code: "PAN", flag: "🇵🇦", confederation: "CONCACAF" },
  ],
};

export const worldCupTeams = worldCupGroupOrder.flatMap((group) => worldCupGroups[group]);
