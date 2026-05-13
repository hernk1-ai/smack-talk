import { redirect } from "next/navigation";

import { SettingsPage } from "@/components/settings/SettingsPage";
import { ensureProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsRoute() {
  const supabase = await createClient();

  if (!supabase) {
    return <SettingsPage />;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { profile } = await ensureProfile(supabase, user);

  return <SettingsPage email={user.email} profile={profile} />;
}
