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
    { name: "USA", initials: "USA" },
    { name: "Mexico", initials: "MEX" },
    { name: "Canada", initials: "CAN" },
    { name: "Costa Rica", initials: "CRC" },
  ],
  "Group B": [
    { name: "Argentina", initials: "ARG" },
    { name: "Uruguay", initials: "URU" },
    { name: "Paraguay", initials: "PAR" },
    { name: "Chile", initials: "CHI" },
  ],
  "Group C": [
    { name: "Brazil", initials: "BRA" },
    { name: "Colombia", initials: "COL" },
    { name: "Ecuador", initials: "ECU" },
    { name: "Panama", initials: "PAN" },
  ],
  "Group D": [
    { name: "England", initials: "ENG" },
    { name: "Netherlands", initials: "NED" },
    { name: "Belgium", initials: "BEL" },
    { name: "Switzerland", initials: "SUI" },
  ],
  "Group E": [
    { name: "France", initials: "FRA" },
    { name: "Spain", initials: "ESP" },
    { name: "Portugal", initials: "POR" },
    { name: "Italy", initials: "ITA" },
  ],
  "Group F": [
    { name: "Germany", initials: "GER" },
    { name: "Croatia", initials: "CRO" },
    { name: "Denmark", initials: "DEN" },
    { name: "Serbia", initials: "SRB" },
  ],
  "Group G": [
    { name: "Poland", initials: "POL" },
    { name: "Morocco", initials: "MAR" },
    { name: "Senegal", initials: "SEN" },
    { name: "Nigeria", initials: "NGA" },
  ],
  "Group H": [
    { name: "Ghana", initials: "GHA" },
    { name: "Cameroon", initials: "CMR" },
    { name: "South Africa", initials: "RSA" },
    { name: "Qatar", initials: "QAT" },
  ],
  "Group I": [
    { name: "Japan", initials: "JPN" },
    { name: "South Korea", initials: "KOR" },
    { name: "Australia", initials: "AUS" },
    { name: "New Zealand", initials: "NZL" },
  ],
  "Group J": [
    { name: "Iran", initials: "IRN" },
    { name: "Saudi Arabia", initials: "KSA" },
    { name: "Tunisia", initials: "TUN" },
    { name: "Algeria", initials: "ALG" },
  ],
  "Group K": [
    { name: "Turkey", initials: "TUR" },
    { name: "Ukraine", initials: "UKR" },
    { name: "Sweden", initials: "SWE" },
    { name: "Norway", initials: "NOR" },
  ],
  "Group L": [
    { name: "Austria", initials: "AUT" },
    { name: "Czech Republic", initials: "CZE" },
    { name: "Scotland", initials: "SCO" },
    { name: "Wales", initials: "WAL" },
  ],
};

export const worldCupTeams = worldCupGroupOrder.flatMap((group) => worldCupGroups[group]);
