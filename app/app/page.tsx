import { LocktApp } from "@/components/LocktApp";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/profiles";

export default async function AppPage() {
  const supabase = await createClient();

  if (!supabase) {
    return <LocktApp />;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <LocktApp />;
  }

  const { profile } = await ensureProfile(supabase, user);

  return <LocktApp profile={profile} />;
}
