import Link from "next/link";

import type { GameRoomPageData } from "@/lib/seo/gameRoomPage";
import { formatMatchupLabel } from "@/lib/worldCup/matchupDisplay";

export function GameRoomServerPreview({ data }: { data: GameRoomPageData }) {
  const matchup = formatMatchupLabel(data.homeTeam, data.awayTeam);

  return (
    <article
      className="mx-auto w-full max-w-3xl px-4 py-6 text-white sm:px-6"
      aria-label="Game Room match overview"
    >
      <header>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lime-300">
          {data.stage ?? "World Cup Game Room"}
        </p>
        <h1 className="sports-display mt-2 text-3xl italic leading-tight text-white sm:text-4xl">{matchup}</h1>
        <p className="mt-2 text-sm font-semibold text-gray-300">{data.kickoffLabel}</p>
        {data.venueLine ? <p className="mt-1 text-sm font-semibold text-gray-400">{data.venueLine}</p> : null}
      </header>
      <p className="mt-4 text-sm font-semibold leading-6 text-gray-300">
        Follow {matchup} live in the Lockt Game Room for scores, rooting activity, and match discussion.
      </p>
      <Link
        href={`/game/${data.gameId}`}
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-purple-300/45 bg-purple-500/10 px-4 text-xs font-black uppercase tracking-[0.1em] text-purple-200"
      >
        Join Game Room
      </Link>
    </article>
  );
}
