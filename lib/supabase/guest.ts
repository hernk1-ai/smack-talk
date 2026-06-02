import type { User } from "@supabase/supabase-js";

import { guestDisplayNameToUsernameSlug, validateGuestDisplayName } from "@/lib/guest/displayName";
import { serializeAvatarKey } from "@/lib/avatar";
import { createClient } from "@/lib/supabase/client";
import { getCurrentProfile } from "@/lib/supabase/profiles";
import type { AppSupabaseClient } from "@/lib/supabase/typedClient";
import type { Profile } from "@/lib/supabase/types";

function randomSuffix() {
  return Math.random().toString(36).slice(2, 6);
}

async function generateUniqueGuestUsername(supabase: AppSupabaseClient, displayName: string) {
  const base = guestDisplayNameToUsernameSlug(displayName);

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base.slice(0, 14)}_${randomSuffix()}`.slice(0, 20);
    const { data } = await supabase.from("profiles").select("id").eq("username", candidate).maybeSingle();

    if (!data) {
      return candidate;
    }
  }

  return `${base.slice(0, 12)}_${randomSuffix()}`.slice(0, 20);
}

export async function upsertGuestProfile(supabase: AppSupabaseClient, user: User, displayName: string) {
  const validation = validateGuestDisplayName(displayName);
  if (!validation.valid) {
    return { profile: null as Profile | null, error: new Error(validation.error ?? "Invalid name.") };
  }

  const username = await generateUniqueGuestUsername(supabase, validation.cleaned);
  const avatarUrl = serializeAvatarKey("logo");

  const { data: existing } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  const payload = {
    display_name: validation.cleaned,
    username,
    avatar_url: avatarUrl,
    is_guest: true,
    profile_claimed: false,
    onboarding_completed: true,
    level: "Fan",
  };

  if (existing) {
    const { data, error } = await supabase.from("profiles").update(payload).eq("id", user.id).select("*").single();
    return { profile: data as Profile | null, error };
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email ?? null,
      favorite_teams: [],
      reputation: 0,
      reputation_score: 0,
      created_takes_count: 0,
      starter_rep_awarded: false,
      ...payload,
    })
    .select("*")
    .single();

  return { profile: data as Profile | null, error };
}

export async function signInAsGuest(displayName: string, supabaseOverride?: AppSupabaseClient) {
  const supabase = supabaseOverride ?? createClient();

  if (!supabase) {
    return { profile: null as Profile | null, user: null as User | null, error: new Error("Supabase is not configured.") };
  }

  const validation = validateGuestDisplayName(displayName);
  if (!validation.valid) {
    return { profile: null, user: null, error: new Error(validation.error ?? "Invalid name.") };
  }

  const {
    data: { user: existingUser },
  } = await supabase.auth.getUser();

  if (existingUser && !existingUser.is_anonymous) {
    const { profile } = await getCurrentProfile(supabase);
    return { profile, user: existingUser, error: new Error("You are already signed in.") };
  }

  if (existingUser?.is_anonymous) {
    const { profile, error } = await upsertGuestProfile(supabase, existingUser, validation.cleaned);
    return { profile, user: existingUser, error };
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously();

  if (signInError || !signInData.user) {
    const message =
      signInError?.message?.toLowerCase().includes("anonymous") || signInError?.message?.toLowerCase().includes("disabled")
        ? "Guest join is not enabled yet. Turn on anonymous sign-ins in Supabase Auth, or log in with an account."
        : signInError?.message ?? "Unable to join the Game Room right now.";

    return { profile: null, user: null, error: new Error(message) };
  }

  const { profile, error: profileError } = await upsertGuestProfile(supabase, signInData.user, validation.cleaned);

  return { profile, user: signInData.user, error: profileError };
}

export function isUnclaimedGuest(profile: Profile | null | undefined) {
  return Boolean(profile?.is_guest && !profile?.profile_claimed);
}

export function getGuestDisplayLabel(profile: Profile | null | undefined) {
  if (!profile) {
    return null;
  }

  return profile.display_name?.trim() || profile.username?.trim() || null;
}

export function shouldShowClaimPrompt(profile: Profile | null | undefined, activityCount: number) {
  if (!isUnclaimedGuest(profile) || activityCount < 1) {
    return false;
  }

  if (typeof window === "undefined" || !profile?.id) {
    return false;
  }

  return window.localStorage.getItem(claimDismissKey(profile.id)) !== "1";
}

export function dismissClaimPrompt(userId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(claimDismissKey(userId), "1");
}

function claimDismissKey(userId: string) {
  return `lockt_claim_profile_dismissed_${userId}`;
}
