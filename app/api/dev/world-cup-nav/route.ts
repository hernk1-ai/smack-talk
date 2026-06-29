import { NextResponse } from "next/server";

import { buildKnockoutResolutionContext } from "@/lib/worldCup/knockoutMatchResolver";
import { fetchKnockoutResolutionData } from "@/lib/worldCup/fetchKnockoutResolution";
import {
  getCurrentLiveWorldCupMatch,
  getNextWorldCupMatch,
  resolveGameRoomNavTarget,
  validateWorldCupNav,
} from "@/lib/worldCupMatchResolver";

/**
 * Dev-only smoke check for the World Cup Game Room nav resolvers.
 * Run: `curl http://localhost:3000/api/dev/world-cup-nav`
 * Returns 404 in production so it never ships as a live endpoint.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const now = new Date();
  const knockoutResolution = await fetchKnockoutResolutionData();
  const knockoutContext =
    knockoutResolution.standings.length || knockoutResolution.bracket.length
      ? buildKnockoutResolutionContext(knockoutResolution)
      : null;
  const live = getCurrentLiveWorldCupMatch(now, undefined, [], knockoutContext);
  const next = getNextWorldCupMatch(now, undefined, [], knockoutContext);
  const navTarget = resolveGameRoomNavTarget(now, undefined, [], knockoutContext);
  const validation = validateWorldCupNav();

  return NextResponse.json(
    {
      now: now.toISOString(),
      liveMatch: live ? { id: live.id, matchup: `${live.homeTeam} vs ${live.awayTeam ?? "TBD"}` } : null,
      nextMatch: next ? { id: next.id, matchup: `${next.homeTeam} vs ${next.awayTeam ?? "TBD"}` } : null,
      navResolvesTo: navTarget.href,
      navLifecycle: navTarget.lifecycle,
      navSelectionReason: navTarget.selectionReason,
      navSelectedGameId: navTarget.game?.id ?? null,
      validation,
    },
    { status: validation.ok ? 200 : 500 },
  );
}
