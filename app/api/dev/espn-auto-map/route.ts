import { NextResponse } from "next/server";

import { validateEspnAutoMapping } from "@/lib/sports/espnWorldCupSync";
import { getEspnTeamAlignment, parseEspnAtEventName } from "@/lib/sports/espnTeamAlignment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const validation = validateEspnAutoMapping();
  const alignmentChecks = [
    {
      name: "parse Qatar at Switzerland event name",
      pass: (() => {
        const parsed = parseEspnAtEventName("Qatar at Switzerland");
        return parsed?.awayTeam === "Qatar" && parsed?.homeTeam === "Switzerland";
      })(),
    },
    {
      name: "wc-2026-8 unchanged when already ESPN-ordered",
      pass: getEspnTeamAlignment(
        { home_team: "Qatar", away_team: "Switzerland" },
        {
          name: "Switzerland at Qatar",
          homeTeam: "Qatar",
          awayTeam: "Switzerland",
        },
      ).confident && !getEspnTeamAlignment(
        { home_team: "Qatar", away_team: "Switzerland" },
        {
          name: "Switzerland at Qatar",
          homeTeam: "Qatar",
          awayTeam: "Switzerland",
        },
      ).needsSwap,
    },
    {
      name: "wc-2026-8 detects reversed teams",
      pass: getEspnTeamAlignment(
        { home_team: "Switzerland", away_team: "Qatar" },
        {
          name: "Switzerland at Qatar",
          homeTeam: "Qatar",
          awayTeam: "Switzerland",
        },
      ).needsSwap,
    },
    {
      name: "wc-2026-4 Paraguay at United States",
      pass: getEspnTeamAlignment(
        { home_team: "United States", away_team: "Paraguay" },
        {
          name: "Paraguay at United States",
          homeTeam: "United States",
          awayTeam: "Paraguay",
        },
      ).confident,
    },
    {
      name: "wc-2026-3 Bosnia-Herzegovina at Canada",
      pass: getEspnTeamAlignment(
        { home_team: "Canada", away_team: "Bosnia and Herzegovina" },
        {
          name: "Bosnia-Herzegovina at Canada",
          homeTeam: "Canada",
          awayTeam: "Bosnia-Herzegovina",
        },
      ).confident,
    },
  ];

  return NextResponse.json({
    ...validation,
    alignmentChecks,
    ok: validation.ok && alignmentChecks.every((check) => check.pass),
  });
}
