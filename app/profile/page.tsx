import { LocktApp } from "@/components/LocktApp";
import { ensureProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();

  if (!supabase) {
    return <LocktApp initialView="profile" />;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <LocktApp initialView="profile" />;
  }

  const { profile } = await ensureProfile(supabase, user);

  return <LocktApp profile={profile} initialView="profile" />;
}
