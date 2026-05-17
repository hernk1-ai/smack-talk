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
  initials: string;
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
    { name: "Mexico", initials: "MEX" },
    { name: "South Korea", initials: "KOR" },
    { name: "South Africa", initials: "RSA" },
    { name: "Czechia", initials: "CZE" },
  ],
  "Group B": [
    { name: "Canada", initials: "CAN" },
    { name: "Bosnia and Herzegovina", initials: "BIH" },
    { name: "Qatar", initials: "QAT" },
    { name: "Switzerland", initials: "SUI" },
  ],
  "Group C": [
    { name: "Brazil", initials: "BRA" },
    { name: "Morocco", initials: "MAR" },
    { name: "Haiti", initials: "HAI" },
    { name: "Scotland", initials: "SCO" },
  ],
  "Group D": [
    { name: "United States", initials: "USA" },
    { name: "Paraguay", initials: "PAR" },
    { name: "Australia", initials: "AUS" },
    { name: "Türkiye", initials: "TUR" },
  ],
  "Group E": [
    { name: "Germany", initials: "GER" },
    { name: "Curaçao", initials: "CUW" },
    { name: "Côte d'Ivoire", initials: "CIV" },
    { name: "Ecuador", initials: "ECU" },
  ],
  "Group F": [
    { name: "Netherlands", initials: "NED" },
    { name: "Japan", initials: "JPN" },
    { name: "Sweden", initials: "SWE" },
    { name: "Tunisia", initials: "TUN" },
  ],
  "Group G": [
    { name: "Belgium", initials: "BEL" },
    { name: "Egypt", initials: "EGY" },
    { name: "Iran", initials: "IRN" },
    { name: "New Zealand", initials: "NZL" },
  ],
  "Group H": [
    { name: "Spain", initials: "ESP" },
    { name: "Cabo Verde", initials: "CPV" },
    { name: "Saudi Arabia", initials: "KSA" },
    { name: "Uruguay", initials: "URU" },
  ],
  "Group I": [
    { name: "France", initials: "FRA" },
    { name: "Senegal", initials: "SEN" },
    { name: "Iraq", initials: "IRQ" },
    { name: "Norway", initials: "NOR" },
  ],
  "Group J": [
    { name: "Argentina", initials: "ARG" },
    { name: "Algeria", initials: "ALG" },
    { name: "Austria", initials: "AUT" },
    { name: "Jordan", initials: "JOR" },
  ],
  "Group K": [
    { name: "Portugal", initials: "POR" },
    { name: "DR Congo", initials: "COD" },
    { name: "Uzbekistan", initials: "UZB" },
    { name: "Colombia", initials: "COL" },
  ],
  "Group L": [
    { name: "England", initials: "ENG" },
    { name: "Croatia", initials: "CRO" },
    { name: "Ghana", initials: "GHA" },
    { name: "Panama", initials: "PAN" },
  ],
};

export const worldCupTeams = worldCupGroupOrder.flatMap((group) => worldCupGroups[group]);
