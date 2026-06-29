import { AppHeader } from "@/components/AppHeader";
import { WorldCupSchedule } from "@/components/world-cup/WorldCupSchedule";
import { RouteBottomNav } from "@/components/BottomNav";
import { ensureProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";
import { fetchResolvedMatchContextInput } from "@/lib/worldCup/fetchResolvedMatchContext";
import { buildScheduleMatchStates } from "@/lib/worldCup/scheduleStatus";

export default async function SchedulePage() {
  const now = new Date();
  const [matchContext, supabase] = await Promise.all([fetchResolvedMatchContextInput(), createClient()]);
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

  const matchStates = buildScheduleMatchStates(matchContext.games ?? [], now);

  return (
    <main className="min-h-screen bg-transparent px-4 py-5 pb-28 text-white sm:py-6">
      <div className="page-rhythm mx-auto w-full max-w-5xl screen-safe-bottom">
        <AppHeader
          subtitle="Schedule · Find a game and open its room."
          profile={profile}
          rightAriaLabel="Account"
        />
        <WorldCupSchedule
          matchStates={matchStates}
          initialNowIso={now.toISOString()}
          matchContext={matchContext}
        />
      </div>
      <RouteBottomNav activeView="schedule" />
    </main>
  );
}
