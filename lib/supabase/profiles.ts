import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Database, Profile } from "@/lib/supabase/types";

export type AppSupabaseClient = SupabaseClient<Database>;

export function getPostLoginRedirect(profile: Profile | null) {
  if (!profile) {
    return "/username";
  }

  if (profile.onboarding_completed) {
    return "/app";
  }

  if (!profile.username) {
    return "/username";
  }

  if (!profile.favorite_teams || profile.favorite_teams.length === 0) {
    return `/onboarding/profile-pic?username=${encodeURIComponent(profile.username)}`;
  }

  return `/onboarding/enter-arena?username=${encodeURIComponent(profile.username)}&teams=${encodeURIComponent(
    profile.favorite_teams.join(","),
  )}`;
}

export async function getCurrentProfile(supabase: AppSupabaseClient) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { user: null, profile: null, error: userError };
  }

  const { profile, error } = await ensureProfile(supabase, user);
  return { user, profile, error };
}

export async function ensureProfile(supabase: AppSupabaseClient, user: User) {
  const { data: existingProfile, error: selectError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfile || selectError) {
    return { profile: existingProfile, error: selectError };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email ?? null,
      favorite_teams: [],
      reputation: 0,
      reputation_score: 0,
      created_takes_count: 0,
      starter_rep_awarded: false,
      level: "Rookie",
      onboarding_completed: false,
    })
    .select("*")
    .single();

  return { profile, error };
}
