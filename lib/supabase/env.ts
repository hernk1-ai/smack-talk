/**
 * Safe to expose in the browser (project URL only).
 * NEXT_PUBLIC_SUPABASE_URL
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * Safe to expose in the browser (anon key; RLS enforces access).
 * NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Server-only. Never prefix with NEXT_PUBLIC_. Used in lib/supabase/admin.ts only. */
export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
export const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
export const notificationFanoutSecret = process.env.NOTIFICATION_FANOUT_SECRET;

/** Server-only. Never prefix with NEXT_PUBLIC_. Gates the hidden admin game-control tools. */
export const adminSecret = process.env.ADMIN_SECRET;

/** True only when a non-empty ADMIN_SECRET is configured. Admin tools fail closed otherwise. */
export const isAdminConfigured = Boolean(adminSecret && adminSecret.trim().length > 0);

/**
 * Server-only. Never prefix with NEXT_PUBLIC_. Vercel Cron sends this as
 * `Authorization: Bearer <CRON_SECRET>`. Used to authorize scheduled sync jobs.
 */
export const cronSecret = process.env.CRON_SECRET;

/** True only when a non-empty CRON_SECRET is configured. */
export const isCronConfigured = Boolean(cronSecret && cronSecret.trim().length > 0);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const isSupabaseAdminConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);
export const isNotificationFanoutConfigured = Boolean(
  vapidPublicKey && vapidPrivateKey && notificationFanoutSecret && supabaseServiceRoleKey,
);

/** Returns a specific setup error for server routes that require the admin client. */
export function getSupabaseAdminSetupError() {
  if (!supabaseUrl?.trim()) {
    return "Missing NEXT_PUBLIC_SUPABASE_URL.";
  }

  if (!supabaseServiceRoleKey?.trim()) {
    return "Missing SUPABASE_SERVICE_ROLE_KEY.";
  }

  return null;
}
