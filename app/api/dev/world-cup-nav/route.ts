import { NextResponse } from "next/server";

import { fetchResolvedMatchContext } from "@/lib/worldCup/fetchResolvedMatchContext";
import { resolveMatch } from "@/lib/worldCup/resolvedMatch";
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
  const resolvedContext = await fetchResolvedMatchContext(now);
  const live = getCurrentLiveWorldCupMatch(now, undefined, [], resolvedContext);
  const next = getNextWorldCupMatch(now, undefined, [], resolvedContext);
  const navTarget = resolveGameRoomNavTarget(now, undefined, [], resolvedContext);
  const validation = validateWorldCupNav();
  const liveResolved = live ? resolveMatch(live, resolvedContext) : null;
  const nextResolved = next ? resolveMatch(next, resolvedContext) : null;

  return NextResponse.json(
    {
      now: now.toISOString(),
      liveMatch: liveResolved ? { id: liveResolved.matchId, matchup: liveResolved.title } : null,
      nextMatch: nextResolved ? { id: nextResolved.matchId, matchup: nextResolved.title } : null,
      navResolvesTo: navTarget.href,
      navLifecycle: navTarget.lifecycle,
      navSelectionReason: navTarget.selectionReason,
      navSelectedGameId: navTarget.game?.id ?? null,
      validation,
    },
    { status: validation.ok ? 200 : 500 },
  );
}
