import { TakeThreadScreen } from "@/components/screens/TakeThreadScreen";
import { ensureProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

export default async function TakePage({ params }: { params: Promise<{ takeId: string }> }) {
  const { takeId } = await params;
  const supabase = await createClient();
  let profile = null;

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const result = await ensureProfile(supabase, user);
      profile = result.profile;
    }
  }

  return <TakeThreadScreen takeId={takeId} profile={profile} />;
}
