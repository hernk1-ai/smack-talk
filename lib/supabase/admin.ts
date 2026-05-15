import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { isSupabaseAdminConfigured, supabaseServiceRoleKey, supabaseUrl } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/types";

export function createAdminClient() {
  if (!isSupabaseAdminConfigured || !supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
