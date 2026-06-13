import type { User } from "@supabase/supabase-js";

import type { AppSupabaseClient } from "@/lib/supabase/profiles";
import type { Profile } from "@/lib/supabase/types";

export function isAnonymousAuthUser(user: User | null | undefined) {
  return Boolean(user?.is_anonymous);
}

/** Marks the existing profiles row as claimed without creating a new user/profile. */
export async function finalizeGuestClaimProfile(supabase: AppSupabaseClient, user: User) {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      is_guest: false,
      profile_claimed: true,
      onboarding_completed: true,
      email: user.email ?? undefined,
    })
    .eq("id", user.id)
    .select("*")
    .single();

  if (!error) {
    await supabase.auth.updateUser({
      data: {
        claim_pending: false,
      },
    });
  }

  return { profile: (data as Profile | null) ?? null, error };
}

export function isGuestClaimPending(user: User | null | undefined) {
  return Boolean(user?.user_metadata?.claim_pending);
}

export async function claimGuestEmail(supabase: AppSupabaseClient, email: string, redirectNext: string) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return { error: new Error("Join the Game Room first, then claim your profile.") };
  }

  if (!user.is_anonymous) {
    return { error: new Error("You already have a full account.") };
  }

  const { error } = await supabase.auth.updateUser({
    email: email.trim(),
    data: {
      claim_pending: true,
    },
  });

  if (error) {
    return { error };
  }

  return {
    error: null,
    verifyPath: `/verify-email?email=${encodeURIComponent(email.trim())}&claim=1&next=${encodeURIComponent(redirectNext)}`,
  };
}

export async function claimGuestGoogle(supabase: AppSupabaseClient, redirectTo: string) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return { error: new Error("Join the Game Room first, then claim your profile.") };
  }

  if (!user.is_anonymous) {
    return { error: new Error("You already have a full account.") };
  }

  const { error } = await supabase.auth.linkIdentity({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  return { error };
}

export async function setClaimedGuestPassword(supabase: AppSupabaseClient, password: string) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;

  if (userError || !user) {
    return { profile: null as Profile | null, error: userError ?? new Error("Unable to verify your session.") };
  }

  const { error: passwordError } = await supabase.auth.updateUser({ password });
  if (passwordError) {
    return { profile: null, error: passwordError };
  }

  return finalizeGuestClaimProfile(supabase, user);
}
