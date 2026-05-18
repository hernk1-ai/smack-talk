import { createClient } from "@/lib/supabase/client";

export type NotificationPreferences = {
  push_enabled: boolean;
  email_enabled: boolean;
  follows_enabled: boolean;
  replies_enabled: boolean;
  reactions_enabled: boolean;
  receipts_enabled: boolean;
};

const defaultPreferences: NotificationPreferences = {
  push_enabled: true,
  email_enabled: false,
  follows_enabled: true,
  replies_enabled: true,
  reactions_enabled: true,
  receipts_enabled: true,
};

export async function getMyNotificationPreferences() {
  const supabase = createClient();
  if (!supabase) return { preferences: defaultPreferences, error: new Error("Supabase is not configured.") };

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) return { preferences: defaultPreferences, error: userError };
  if (!user) return { preferences: defaultPreferences, error: null };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;
  const { data, error } = await client
    .from("notification_preferences")
    .select("push_enabled, email_enabled, follows_enabled, replies_enabled, reactions_enabled, receipts_enabled")
    .eq("user_id", user.id)
    .maybeSingle();

  return { preferences: { ...defaultPreferences, ...(data ?? {}) }, error };
}

export async function updateMyNotificationPreferences(preferences: NotificationPreferences) {
  const supabase = createClient();
  if (!supabase) return { error: new Error("Supabase is not configured.") };

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) return { error: userError };
  if (!user) return { error: new Error("Please sign in.") };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;
  const { error } = await client
    .from("notification_preferences")
    .upsert({ user_id: user.id, ...preferences }, { onConflict: "user_id" });

  return { error };
}
