import type { Profile } from "@/lib/supabase/types";

const DISMISS_KEY = "lockt_profile_completion_dismissed";

export function profileNeedsCompletion(profile: Profile | null | undefined): boolean {
  if (!profile) {
    return false;
  }

  // Guests already get display_name + username during join.
  if (profile.is_guest && !profile.profile_claimed) {
    return false;
  }

  const username = profile.username?.trim();
  const displayName = profile.display_name?.trim();

  if (!username && !displayName) {
    return true;
  }

  // Full accounts should have a real username, not just the header fallback.
  if (!profile.is_guest && !username) {
    return true;
  }

  return false;
}

export function isProfileCompletionDismissed(userId: string) {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(`${DISMISS_KEY}_${userId}`) === "1";
}

export function dismissProfileCompletion(userId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(`${DISMISS_KEY}_${userId}`, "1");
}
