import { createClient } from "@/lib/supabase/client";
import type { AppSupabaseClient } from "@/lib/supabase/typedClient";

export type ReportTargetType = "take" | "reply" | "user";
export type ReportReason = "harassment" | "hate_speech" | "spam" | "threats" | "impersonation" | "inappropriate_content" | "other";

export async function createReport({
  targetType,
  targetId,
  reason,
  details,
  supabase: supabaseOverride,
  reporterUserId,
}: {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
  supabase?: AppSupabaseClient;
  reporterUserId?: string;
}) {
  const supabase = supabaseOverride ?? createClient();

  if (!supabase) {
    return { report: null, error: new Error("Supabase is not configured.") };
  }

  let reporterId = reporterUserId;

  if (!reporterId) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return { report: null, error: userError };
    }

    if (!user) {
      return { report: null, error: new Error("Log in to report content.") };
    }

    reporterId = user.id;
  }

  const { data, error } = await supabase
    .from("reports")
    .insert({
      reporter_user_id: reporterId,
      target_type: targetType,
      target_id: targetId,
      reason,
      details: details?.trim() || null,
    })
    .select("*")
    .single();

  return { report: data, error };
}

export async function getMyModerationFilters(supabaseOverride?: AppSupabaseClient) {
  const supabase = supabaseOverride ?? createClient();

  if (!supabase) {
    return { mutedUserIds: [] as string[], blockedUserIds: [] as string[] };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { mutedUserIds: [] as string[], blockedUserIds: [] as string[] };
  }

  const [{ data: mutes }, { data: blocks }] = await Promise.all([
    supabase.from("user_mutes").select("muted_user_id").eq("user_id", user.id),
    supabase.from("user_blocks").select("blocked_user_id").eq("user_id", user.id),
  ]);

  return {
    mutedUserIds: (mutes ?? []).map((row) => row.muted_user_id),
    blockedUserIds: (blocks ?? []).map((row) => row.blocked_user_id),
  };
}

export async function muteUser(targetUserId: string) {
  const supabase = createClient();

  if (!supabase) {
    return { error: new Error("Supabase is not configured.") };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: new Error("Log in to mute users.") };
  }

  const { error } = await supabase.from("user_mutes").upsert(
    {
      user_id: user.id,
      muted_user_id: targetUserId,
    },
    { onConflict: "user_id,muted_user_id" },
  );

  return { error };
}

export async function blockUser(targetUserId: string) {
  const supabase = createClient();

  if (!supabase) {
    return { error: new Error("Supabase is not configured.") };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: new Error("Log in to block users.") };
  }

  const { error } = await supabase.from("user_blocks").upsert(
    {
      user_id: user.id,
      blocked_user_id: targetUserId,
    },
    { onConflict: "user_id,blocked_user_id" },
  );

  return { error };
}
