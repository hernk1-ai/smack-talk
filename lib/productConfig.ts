import type { SportKey } from "@/data/sportsStructure";

// World Cup Match Hub MVP — broader receipts/profile/rep/trophy systems are
// intentionally hidden here and may be restored later via these flags.
export const ACTIVE_SPORT: SportKey = "World Cup";
export type ProductMode = "match_hub" | "pre_tournament";
export const PRODUCT_MODE: ProductMode = "match_hub";

export const SHOW_PROFILES = false;
export const SHOW_RECEIPTS_PAGE = false;
export const SHOW_TROPHIES = false;
export const SHOW_REP_SYSTEM_PUBLICLY = false;
export const SHOW_FOLLOW_SYSTEM_PUBLICLY = false;
export const SHOW_SOCIAL_PROFILE_FEATURES = false;

export const SHOW_GAME_ROOM = true;
export const SHOW_GAME_ROOM_IN_NAV = false;
export const SHOW_MATCH_HUB = true;
export const SHOW_SCHEDULE = true;

export const SHOW_MULTI_SPORT = false;
export const SHOW_SEEDED_TAKES = false;
export const SHOW_FAKE_LIVE_ACTIVITY = false;

export function isMatchHubMode() {
  return PRODUCT_MODE === "match_hub";
}

/** @deprecated Use isMatchHubMode — kept for stored feature branches. */
export function isPreTournamentMode() {
  return isMatchHubMode() || PRODUCT_MODE === "pre_tournament";
}

export function getVisibleSportTabs(allTabs: SportKey[]) {
  if (SHOW_MULTI_SPORT) {
    return allTabs;
  }

  return allTabs.filter((tab) => tab === ACTIVE_SPORT);
}

export function shouldShowArchivedSocialFeatures() {
  return (
    SHOW_PROFILES ||
    SHOW_RECEIPTS_PAGE ||
    SHOW_TROPHIES ||
    SHOW_REP_SYSTEM_PUBLICLY ||
    SHOW_FOLLOW_SYSTEM_PUBLICLY ||
    SHOW_SOCIAL_PROFILE_FEATURES
  );
}

// Multi-sport support is intentionally hidden for World Cup MVP launch.
// Keep underlying sport systems and components for future reactivation.
