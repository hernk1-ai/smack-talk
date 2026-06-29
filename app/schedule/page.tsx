import { AppHeader } from "@/components/AppHeader";
import { WorldCupSchedule } from "@/components/world-cup/WorldCupSchedule";
import { RouteBottomNav } from "@/components/BottomNav";
import { ensureProfile } from "@/lib/supabase/profiles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { fetchKnockoutResolutionData } from "@/lib/worldCup/fetchKnockoutResolution";
import { buildScheduleMatchStates, type ScheduleGameRow } from "@/lib/worldCup/scheduleStatus";

export default async function SchedulePage() {
  const now = new Date();
  const [knockoutResolution, supabase] = await Promise.all([fetchKnockoutResolutionData(), createClient()]);
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

  // Merge live game state (score/status) from the games table when available.
  // Falls back to kickoff-derived status when Supabase/admin is not configured.
  let gameRows: ScheduleGameRow[] = [];
  const admin = createAdminClient();
  if (admin) {
    const { data } = await admin
      .from("games")
      .select("id, status, home_score, away_score")
      .eq("league", "World Cup");
    if (data) {
      gameRows = data as ScheduleGameRow[];
    }
  }
  const matchStates = buildScheduleMatchStates(gameRows, now);

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
          knockoutResolution={knockoutResolution}
        />
      </div>
      <RouteBottomNav activeView="schedule" />
    </main>
  );
}
