import { NextResponse, type NextRequest } from "next/server";

import { syncNbaGames } from "@/lib/supabase/gameSync";

export async function GET(request: NextRequest) {
  return syncGames(request);
}

export async function POST(request: NextRequest) {
  return syncGames(request);
}

async function syncGames(request: NextRequest) {
  const configuredSecret = process.env.SYNC_GAMES_SECRET;
  const providedSecret = request.headers.get("x-sync-secret") ?? request.nextUrl.searchParams.get("secret");

  if (configuredSecret && providedSecret !== configuredSecret) {
    return NextResponse.json({ error: "Unauthorized sync request." }, { status: 401 });
  }

  try {
    const date = request.nextUrl.searchParams.get("date") ?? undefined;
    const { games, error } = await syncNbaGames({ date });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      provider: "espn",
      league: "NBA",
      count: games.length,
      games,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not sync NBA games.",
      },
      { status: 500 },
    );
  }
}
