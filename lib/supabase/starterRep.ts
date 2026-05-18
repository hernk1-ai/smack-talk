import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

type StarterRewardResult = {
  awarded: boolean;
  newRep: number | null;
};

const STARTER_REP_BONUS = 200;

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

  const nextRep = (profileBefore.reputation_score ?? 0) + STARTER_REP_BONUS;

  const { data: updatedProfiles, error: updateError } = await supabase
    .from("profiles")
    .update({
      starter_rep_awarded: true,
      level: "Player",
      reputation_score: nextRep,
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

  await supabase.from("user_trophies").upsert(
    {
      user_id: userId,
      trophy_key: "first_lock",
      trophy_name: "First Lock",
      description: "You made your first World Cup call.",
    },
    { onConflict: "user_id,trophy_key", ignoreDuplicates: true },
  );

  return { awarded: true, newRep: updatedProfiles?.[0]?.reputation_score ?? nextRep };
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
