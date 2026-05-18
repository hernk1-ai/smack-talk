import { createClient } from "@/lib/supabase/client";

export type LocktNotificationType =
  | "follow_request"
  | "follow_accepted"
  | "take_replied"
  | "take_rode"
  | "take_faded"
  | "pick_locked"
  | "receipt_ready";

export type LocktNotification = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: LocktNotificationType;
  title: string;
  body: string | null;
  entity_type: string | null;
  entity_id: string | null;
  read_at: string | null;
  created_at: string;
};

export async function createNotification({
  userId,
  type,
  title,
  body,
  entityType,
  entityId,
}: {
  userId: string;
  type: LocktNotificationType;
  title: string;
  body?: string | null;
  entityType?: string | null;
  entityId?: string | null;
}) {
  const supabase = createClient();
  if (!supabase) return { error: new Error("Supabase is not configured.") };

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) return { error: userError };
  if (!user) return { error: new Error("Log in to send notifications.") };
  if (user.id === userId) return { error: null };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;
  const { error } = await client.from("notifications").insert({
    user_id: userId,
    actor_id: user.id,
    type,
    title,
    body: body ?? null,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
  });

  return { error };
}

export async function getMyNotifications(limit = 30) {
  const supabase = createClient();
  if (!supabase) return { notifications: [] as LocktNotification[], error: new Error("Supabase is not configured.") };

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) return { notifications: [] as LocktNotification[], error: userError };
  if (!user) return { notifications: [] as LocktNotification[], error: null };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;
  const { data, error } = await client
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return { notifications: (data ?? []) as LocktNotification[], error };
}

export async function getMyUnreadNotificationCount() {
  const supabase = createClient();
  if (!supabase) return { count: 0, error: new Error("Supabase is not configured.") };

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) return { count: 0, error: userError };
  if (!user) return { count: 0, error: null };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;
  const { count, error } = await client
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  return { count: count ?? 0, error };
}

export async function markNotificationRead(notificationId: string) {
  const supabase = createClient();
  if (!supabase) return { error: new Error("Supabase is not configured.") };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;
  const { error } = await client
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);

  return { error };
}
