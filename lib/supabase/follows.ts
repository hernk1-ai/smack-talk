import { createClient } from "@/lib/supabase/client";
import { createNotification } from "@/lib/supabase/notifications";
import type { Follow, Profile } from "@/lib/supabase/types";

export async function getCurrentUserId() {
  const supabase = createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getFollowStatus(targetUserId: string) {
  const supabase = createClient();
  if (!supabase) return { follow: null as Follow | null, error: new Error("Supabase is not configured.") };
  const userId = await getCurrentUserId();
  if (!userId || userId === targetUserId) return { follow: null as Follow | null, error: null };

  const { data, error } = await supabase
    .from("follows")
    .select("*")
    .eq("follower_id", userId)
    .eq("following_id", targetUserId)
    .maybeSingle();
  return { follow: data, error };
}

export async function followUser(targetProfile: Pick<Profile, "id" | "account_visibility">) {
  const supabase = createClient();
  if (!supabase) return { follow: null as Follow | null, error: new Error("Supabase is not configured.") };
  const userId = await getCurrentUserId();
  if (!userId) return { follow: null as Follow | null, error: new Error("Please sign in to follow users.") };
  if (userId === targetProfile.id) return { follow: null as Follow | null, error: new Error("You can't follow yourself.") };

  const status: Follow["status"] = targetProfile.account_visibility === "private" ? "pending" : "active";
  const { data, error } = await supabase
    .from("follows")
    .upsert({ follower_id: userId, following_id: targetProfile.id, status }, { onConflict: "follower_id,following_id" })
    .select("*")
    .single();

  if (!error && data) {
    await createNotification({
      userId: targetProfile.id,
      type: "follow_request",
      title: status === "pending" ? "New follow request." : "New follower.",
      body: status === "pending" ? "Someone requested to follow your LOCKT profile." : "Someone followed your LOCKT profile.",
      entityType: "follow",
      entityId: data.id,
    });
  }
  return { follow: data, error };
}

export async function unfollowUser(targetUserId: string) {
  const supabase = createClient();
  if (!supabase) return { error: new Error("Supabase is not configured.") };
  const userId = await getCurrentUserId();
  if (!userId) return { error: new Error("Please sign in to follow users.") };
  const { error } = await supabase.from("follows").delete().eq("follower_id", userId).eq("following_id", targetUserId);
  return { error };
}

export async function getPendingFollowRequests() {
  const supabase = createClient();
  if (!supabase) return { requests: [] as Follow[], error: new Error("Supabase is not configured.") };
  const userId = await getCurrentUserId();
  if (!userId) return { requests: [] as Follow[], error: null };
  const { data, error } = await supabase
    .from("follows")
    .select("*")
    .eq("following_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return { requests: data ?? [], error };
}

export async function respondToFollowRequest(followId: string, approve: boolean) {
  const supabase = createClient();
  if (!supabase) return { error: new Error("Supabase is not configured.") };
  const userId = await getCurrentUserId();
  if (!userId) return { error: new Error("Please sign in.") };

  if (approve) {
    const { data, error } = await supabase
      .from("follows")
      .update({ status: "active" })
      .eq("id", followId)
      .eq("following_id", userId)
      .select("id, follower_id")
      .maybeSingle();
    if (!error && data?.follower_id) {
      await createNotification({
        userId: data.follower_id,
        type: "follow_accepted",
        title: "Follow request accepted.",
        body: "Your request was accepted. You can now view this profile.",
        entityType: "follow",
        entityId: data.id,
      });
    }
    return { error };
  }

  const { error } = await supabase.from("follows").delete().eq("id", followId).eq("following_id", userId);
  return { error };
}

export async function getFollowingUserIds() {
  const supabase = createClient();
  if (!supabase) return { userIds: [] as string[], error: new Error("Supabase is not configured.") };
  const userId = await getCurrentUserId();
  if (!userId) return { userIds: [] as string[], error: null };
  const { data, error } = await supabase.from("follows").select("following_id").eq("follower_id", userId).eq("status", "active");
  return { userIds: (data ?? []).map((row) => row.following_id), error };
}

export async function getFollowersList() {
  const supabase = createClient();
  if (!supabase) return { users: [] as Array<{ id: string; username: string | null; avatar_url: string | null }>, error: new Error("Supabase is not configured.") };
  const userId = await getCurrentUserId();
  if (!userId) return { users: [], error: new Error("Please sign in to view followers.") };

  const { data: followRows, error } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("following_id", userId)
    .eq("status", "active");

  if (error) return { users: [], error };
  const ids = (followRows ?? []).map((row) => row.follower_id);
  if (!ids.length) return { users: [], error: null };

  const { data: users, error: profileError } = await supabase.from("profile_cards").select("*").in("id", ids);
  return { users: users ?? [], error: profileError };
}

export async function getFollowingList() {
  const supabase = createClient();
  if (!supabase) return { users: [] as Array<{ id: string; username: string | null; avatar_url: string | null }>, error: new Error("Supabase is not configured.") };
  const userId = await getCurrentUserId();
  if (!userId) return { users: [], error: new Error("Please sign in to view following.") };

  const { data: followRows, error } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId)
    .eq("status", "active");

  if (error) return { users: [], error };
  const ids = (followRows ?? []).map((row) => row.following_id);
  if (!ids.length) return { users: [], error: null };

  const { data: users, error: profileError } = await supabase.from("profile_cards").select("*").in("id", ids);
  return { users: users ?? [], error: profileError };
}

export async function searchProfiles(query: string) {
  const supabase = createClient();
  if (!supabase) {
    return {
      users: [] as Array<{ id: string; username: string | null; avatar_url: string | null; account_visibility: Profile["account_visibility"] | null }>,
      error: new Error("Supabase is not configured."),
    };
  }
  const userId = await getCurrentUserId();
  if (!userId) return { users: [], error: new Error("Please sign in to search users.") };

  const clean = query.trim();
  if (!clean) return { users: [], error: null };

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, account_visibility")
    .ilike("username", `%${clean}%`)
    .neq("id", userId)
    .not("username", "is", null)
    .limit(20);

  return { users: data ?? [], error };
}
