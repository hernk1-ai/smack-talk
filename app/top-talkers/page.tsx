import { SmackTalkApp } from "@/components/SmackTalkApp";
import { ensureProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

export default async function TopTalkersPage() {
  const supabase = await createClient();

  if (!supabase) {
    return <SmackTalkApp initialView="top-talkers" />;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <SmackTalkApp initialView="top-talkers" />;
  }

  const { profile } = await ensureProfile(supabase, user);

  return <SmackTalkApp profile={profile} initialView="top-talkers" />;
}
