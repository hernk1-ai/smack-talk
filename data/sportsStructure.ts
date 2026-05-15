export type SportKey =
  | "NBA"
  | "NFL"
  | "MLB"
  | "NHL"
  | "Soccer"
  | "NCAA Football"
  | "NCAA Basketball"
  | "UFC"
  | "Tennis"
  | "World Cup"
  | "Playoffs";

export type SportGameSeed = {
  id: string;
  league: SportKey;
  eventSlug?: string;
  eventName?: string;
};

export const sportTabs: SportKey[] = [
  "NBA",
  "NFL",
  "MLB",
  "NHL",
  "Soccer",
  "NCAA Football",
  "NCAA Basketball",
  "UFC",
  "Tennis",
  "World Cup",
  "Playoffs",
];

export const sportGameSeeds: SportGameSeed[] = [
  { id: "lal-gsw-live", league: "NBA", eventSlug: "playoff-push", eventName: "Playoff Push" },
  { id: "bos-nyk-live", league: "NBA", eventSlug: "east-chaos", eventName: "East Chaos" },
  { id: "kc-phi-live", league: "NFL", eventSlug: "sunday-night-smoke", eventName: "Sunday Night Smoke" },
  { id: "nyy-bos-live", league: "MLB", eventSlug: "rivalry-week", eventName: "Rivalry Week" },
  { id: "edm-dal-live", league: "NHL", eventSlug: "cup-pressure", eventName: "Cup Pressure" },
  { id: "ars-mci-live", league: "Soccer", eventSlug: "title-race", eventName: "Title Race" },
  { id: "osu-mich-live", league: "NCAA Football", eventSlug: "rivalry-week", eventName: "Rivalry Week" },
  { id: "duke-unc-live", league: "NCAA Basketball", eventSlug: "march-smoke", eventName: "March Smoke" },
  { id: "ufc-main-live", league: "UFC", eventSlug: "main-card", eventName: "Main Card" },
  { id: "wim-final-live", league: "Tennis", eventSlug: "grass-court-final", eventName: "Grass Court Final" },
  { id: "usa-bra-live", league: "World Cup", eventSlug: "group-stage", eventName: "Group Stage" },
  { id: "finals-live", league: "Playoffs", eventSlug: "finals-pressure", eventName: "Finals Pressure" },
];

export function getGameSport(gameId: string, fallback: SportKey = "NBA") {
  return sportGameSeeds.find((game) => game.id === gameId)?.league ?? fallback;
}
