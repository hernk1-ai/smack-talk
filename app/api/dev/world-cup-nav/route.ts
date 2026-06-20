import { NextResponse } from "next/server";

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
  const live = getCurrentLiveWorldCupMatch(now);
  const next = getNextWorldCupMatch(now);
  const navTarget = resolveGameRoomNavTarget(now);
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
