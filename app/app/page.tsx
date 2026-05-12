import { SmackTalkApp } from "@/components/SmackTalkApp";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/profiles";

export default async function AppPage() {
  const supabase = await createClient();

  if (!supabase) {
    return <SmackTalkApp />;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <SmackTalkApp />;
  }

  const { profile } = await ensureProfile(supabase, user);

  return <SmackTalkApp profile={profile} />;
}
