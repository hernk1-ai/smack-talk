import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

type StarterRewardResult = {
  awarded: boolean;
  newRep: number | null;
};

const TROPHY_REP_BONUS = 1000;

type TrophyAwardInput = {
  trophyKey: string;
  trophyName: string;
  description: string;
};

export async function awardTrophyWithRep(
  supabase: SupabaseClient<Database>,
  userId: string,
  trophy: TrophyAwardInput,
) {
  const { error: trophyError } = await supabase.from("user_trophies").insert({
    user_id: userId,
    trophy_key: trophy.trophyKey,
    trophy_name: trophy.trophyName,
    description: trophy.description,
  });

  if (trophyError) {
    if (trophyError.code === "23505") {
      return { awarded: false, newRep: null };
    }

    return { awarded: false, newRep: null };
  }

  const { data: currentProfile, error: profileError } = await supabase
    .from("profiles")
    .select("reputation_score")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    return { awarded: false, newRep: null };
  }

  const nextRep = (currentProfile?.reputation_score ?? 0) + TROPHY_REP_BONUS;
  const { data: finalProfile, error: repUpdateError } = await supabase
    .from("profiles")
    .update({ reputation_score: nextRep })
    .eq("id", userId)
    .select("reputation_score")
    .single();

  if (repUpdateError) {
    return { awarded: false, newRep: null };
  }

  return { awarded: true, newRep: finalProfile?.reputation_score ?? nextRep };
}

export async function awardStarterRepAndFirstLockTrophy(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<StarterRewardResult> {
  const { data: profileBefore, error: profileError } = await supabase
    .from("profiles")
    .select("reputation_score, starter_rep_awarded")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profileBefore || profileBefore.starter_rep_awarded) {
    return { awarded: false, newRep: null };
  }

  const { data: updatedProfiles, error: updateError } = await supabase
    .from("profiles")
    .update({
      starter_rep_awarded: true,
      level: "Player",
    })
    .eq("id", userId)
    .eq("starter_rep_awarded", false)
    .select("id, reputation_score");

  if (updateError) {
    return { awarded: false, newRep: null };
  }

  const didAward = Boolean(updatedProfiles?.length);
  if (!didAward) {
    return { awarded: false, newRep: null };
  }

  const trophyAward = await awardTrophyWithRep(supabase, userId, {
    trophyKey: "first_lock",
    trophyName: "First Lock",
    description: "You made your first World Cup call.",
  });

  if (!trophyAward.awarded) {
    return { awarded: false, newRep: updatedProfiles?.[0]?.reputation_score ?? null };
  }

  return { awarded: true, newRep: trophyAward.newRep };
}

export async function getCurrentUserTrophies() {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();

  if (!supabase) {
    return { trophies: [], error: new Error("Supabase is not configured.") };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { trophies: [], error: userError };
  }

  if (!user) {
    return { trophies: [], error: new Error("Please sign in to view trophies.") };
  }

  const { data, error } = await supabase
    .from("user_trophies")
    .select("*")
    .eq("user_id", user.id)
    .order("unlocked_at", { ascending: false });

  return { trophies: data ?? [], error };
}
