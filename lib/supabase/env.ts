export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
export const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
export const notificationFanoutSecret = process.env.NOTIFICATION_FANOUT_SECRET;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const isSupabaseAdminConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);
export const isNotificationFanoutConfigured = Boolean(
  vapidPublicKey && vapidPrivateKey && notificationFanoutSecret && supabaseServiceRoleKey,
);
