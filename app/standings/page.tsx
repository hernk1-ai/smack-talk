import type { Metadata } from "next";

import { AppHeader } from "@/components/AppHeader";
import { RouteBottomNav } from "@/components/BottomNav";
import { WorldCupStandings } from "@/components/world-cup/WorldCupStandings";
import { ensureProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";
import { fetchWorldCupStandingsPageData } from "@/lib/worldCup/standings";

export const metadata: Metadata = {
  title: "World Cup Standings | Lockt",
  description: "Follow updated World Cup group standings, third-place rankings, and knockout qualification on Lockt.",
};

export default async function StandingsPage() {
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

  const standingsData = await fetchWorldCupStandingsPageData();

  return (
    <main className="min-h-screen bg-transparent px-4 py-5 pb-28 text-white sm:py-6">
      <div className="page-rhythm mx-auto w-full max-w-5xl screen-safe-bottom">
        <AppHeader subtitle="Standings · Groups, third place, and knockout path." profile={profile} rightAriaLabel="Account" />
        <WorldCupStandings {...standingsData} />
      </div>
      <RouteBottomNav activeView="standings" />
    </main>
  );
}
