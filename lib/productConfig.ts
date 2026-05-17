import type { SportKey } from "@/data/sportsStructure";

export const ACTIVE_SPORT: SportKey = "World Cup";
export const SHOW_MULTI_SPORT = false;

export function getVisibleSportTabs(allTabs: SportKey[]) {
  if (SHOW_MULTI_SPORT) {
    return allTabs;
  }

  return allTabs.filter((tab) => tab === ACTIVE_SPORT);
}

// Multi-sport support is intentionally hidden for World Cup MVP launch.
// Keep underlying sport systems and components for future reactivation.
