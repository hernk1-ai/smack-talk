import { worldCupGroupOrder } from "@/data/worldCupGroups";
import type { KnockoutBracketRound } from "@/lib/sports/fifaWorldCupStandingsSync";
import { formatStandingsForm, type StandingsPageData, type WorldCupStandingRow } from "@/lib/worldCup/standingsTypes";

type WorldCupStandingsProps = StandingsPageData;

function FormBadge({ result }: { result: string }) {
  const tone =
    result === "W"
      ? "bg-emerald-500/20 text-emerald-300"
      : result === "D"
        ? "bg-white/10 text-gray-300"
        : result === "L"
          ? "bg-rose-500/20 text-rose-300"
          : "bg-white/5 text-gray-500";

  return (
    <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded px-1 text-[10px] font-black ${tone}`}>
      {result}
    </span>
  );
}

function TeamCell({ row }: { row: WorldCupStandingRow }) {
  return (
    <div className="flex min-w-[8.5rem] items-center gap-2">
      {row.flag_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={row.flag_url} alt="" className="h-4 w-4 shrink-0 rounded-sm object-cover" loading="lazy" />
      ) : (
        <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-white/10 text-[8px] font-black text-gray-400">
          {row.team_code.slice(0, 2)}
        </span>
      )}
      <span className="truncate font-semibold text-white">{row.team_name}</span>
    </div>
  );
}

function StandingsTable({
  rows,
  highlightTopTwo = false,
}: {
  rows: WorldCupStandingRow[];
  highlightTopTwo?: boolean;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-500">No standings data yet.</p>;
  }

  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0 text-left text-xs sm:text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-wide text-gray-500 sm:text-[11px]">
            <th className="sticky left-0 z-10 bg-[#101512]/95 px-2 py-2 font-black">Team</th>
            <th className="px-2 py-2 font-black">P</th>
            <th className="px-2 py-2 font-black">W</th>
            <th className="px-2 py-2 font-black">D</th>
            <th className="px-2 py-2 font-black">L</th>
            <th className="px-2 py-2 font-black">GF</th>
            <th className="px-2 py-2 font-black">GA</th>
            <th className="px-2 py-2 font-black">GD</th>
            <th className="px-2 py-2 font-black">Pts</th>
            <th className="px-2 py-2 font-black">Form</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isAdvancing = highlightTopTwo && row.rank <= 2;
            const formLetters = Array.isArray(row.form)
              ? row.form.filter((entry): entry is string => typeof entry === "string")
              : [];

            return (
              <tr
                key={`${row.group_name}-${row.team_code}`}
                className={`border-t border-white/5 ${isAdvancing ? "bg-emerald-500/10" : "bg-transparent"}`}
              >
                <td className="sticky left-0 z-10 bg-[#101512]/95 px-2 py-2.5">
                  <TeamCell row={row} />
                </td>
                <td className="px-2 py-2.5 text-gray-300">{row.played}</td>
                <td className="px-2 py-2.5 text-gray-300">{row.wins}</td>
                <td className="px-2 py-2.5 text-gray-300">{row.draws}</td>
                <td className="px-2 py-2.5 text-gray-300">{row.losses}</td>
                <td className="px-2 py-2.5 text-gray-300">{row.goals_for}</td>
                <td className="px-2 py-2.5 text-gray-300">{row.goals_against}</td>
                <td className="px-2 py-2.5 text-gray-300">{row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}</td>
                <td className="px-2 py-2.5 font-black text-white">{row.points}</td>
                <td className="px-2 py-2.5">
                  <div className="flex gap-0.5">
                    {formLetters.length > 0 ? (
                      formLetters.map((entry, index) => <FormBadge key={`${row.team_code}-${index}`} result={entry} />)
                    ) : (
                      <span className="text-gray-500">{formatStandingsForm(row.form)}</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function KnockoutBracket({ rounds }: { rounds: KnockoutBracketRound[] }) {
  if (rounds.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-6 text-center text-sm text-gray-400">
        Knockout bracket will appear once matchups are confirmed.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rounds.map((round) => (
        <section key={round.round} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
          <h3 className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-purple-300">{round.round}</h3>
          <div className="space-y-2">
            {round.matches.map((match) => (
              <div
                key={match.id}
                className="grid gap-2 rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 sm:grid-cols-[1fr_auto_1fr] sm:items-center"
              >
                <div className="text-sm font-semibold text-white sm:text-right">{match.homeTeam ?? "TBD"}</div>
                <div className="text-center text-xs font-black uppercase tracking-wide text-gray-400">
                  {match.homeScore != null && match.awayScore != null ? `${match.homeScore} – ${match.awayScore}` : "vs"}
                </div>
                <div className="text-sm font-semibold text-white">{match.awayTeam ?? "TBD"}</div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function WorldCupStandings({ groups, thirdPlace, knockoutBracket, lastUpdated, isEmpty }: WorldCupStandingsProps) {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">World Cup Standings</h1>
        <p className="text-sm text-gray-400">Updated daily from FIFA standings.</p>
        {lastUpdated ? (
          <p className="text-xs text-gray-500">
            Last synced {new Date(lastUpdated).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
          </p>
        ) : null}
      </header>

      {isEmpty ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-8 text-center">
          <p className="text-sm text-gray-300">Standings will appear here after the first FIFA sync.</p>
          <p className="mt-2 text-xs text-gray-500">Group tables, third-place rankings, and the knockout bracket update daily.</p>
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-[0.18em] text-gray-300">Group Stage</h2>
          <span className="text-[10px] font-black uppercase tracking-wide text-emerald-300">Top 2 advance</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {worldCupGroupOrder.map((groupName) => (
            <article key={groupName} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
              <h3 className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-purple-300">{groupName}</h3>
              <StandingsTable rows={groups[groupName] ?? []} highlightTopTwo />
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-gray-300">Third-place standings</h2>
        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
          <StandingsTable rows={thirdPlace} />
        </article>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-gray-300">Knockout bracket</h2>
        <KnockoutBracket rounds={knockoutBracket} />
      </section>
    </div>
  );
}
