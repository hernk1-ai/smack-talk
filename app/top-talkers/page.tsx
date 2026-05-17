import { LocktApp } from "@/components/LocktApp";
import { ensureProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

export default async function TopTalkersPage() {
  const supabase = await createClient();

  if (!supabase) {
    return <LocktApp initialView="top-talkers" />;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <LocktApp initialView="top-talkers" />;
  }

  const { profile } = await ensureProfile(supabase, user);

  return <LocktApp profile={profile} initialView="top-talkers" />;
}
