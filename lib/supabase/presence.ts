import { createClient } from "@/lib/supabase/client";

export async function touchMyPresence() {
  const supabase = createClient();

  if (!supabase) {
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await supabase.from("profiles").update({ last_active_at: new Date().toISOString() }).eq("id", user.id);
}
