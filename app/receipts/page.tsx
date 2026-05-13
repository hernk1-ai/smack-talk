import { SmackTalkApp } from "@/components/SmackTalkApp";
import { ensureProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

export default async function ReceiptsPage() {
  const supabase = await createClient();

  if (!supabase) {
    return <SmackTalkApp initialView="receipts" />;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <SmackTalkApp initialView="receipts" />;
  }

  const { profile } = await ensureProfile(supabase, user);

  return <SmackTalkApp profile={profile} initialView="receipts" />;
}
