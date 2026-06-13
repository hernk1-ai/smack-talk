/** Archived onboarding paths — redirect to Match Hub instead of the old wizard. */
export const LEGACY_ONBOARDING_ROUTES = [
  "/username",
  "/onboarding/profile-pic",
  "/onboarding/teams",
  "/onboarding/join-fun",
  "/onboarding/enter-arena",
] as const;

export function isLegacyOnboardingPath(pathname: string) {
  return LEGACY_ONBOARDING_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export const LEGACY_ONBOARDING_REDIRECT = "/app";
