import { AppHeader } from "@/components/AppHeader";
import { WorldCupSchedule } from "@/components/world-cup/WorldCupSchedule";
import { RouteBottomNav } from "@/components/BottomNav";
import { ensureProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

export default async function SchedulePage() {
  const supabase = await createClient();
  let profile = null;

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const ensured = await ensureProfile(supabase, user);
      profile = ensured.profile ?? null;
    }
  }

  return (
    <main className="min-h-screen bg-black px-4 py-5 pb-28 text-white sm:py-6">
      <div className="page-rhythm mx-auto w-full max-w-5xl screen-safe-bottom">
        <AppHeader
          subtitle="Browse World Cup matches and lock your calls."
          profile={profile}
          rightAriaLabel="Schedule"
        />
        <WorldCupSchedule />
      </div>
      <RouteBottomNav activeView="schedule" />
    </main>
  );
}
