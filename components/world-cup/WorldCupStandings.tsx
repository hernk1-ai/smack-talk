import { worldCupGroupOrder } from "@/data/worldCupGroups";
import type { KnockoutBracketMatch, KnockoutBracketRound } from "@/lib/sports/fifaWorldCupStandingsSync";
import { formatStandingsForm, type StandingsPageData, type WorldCupStandingRow } from "@/lib/worldCup/standingsTypes";

const BRACKET_BASE_SLOT_HEIGHT = 5.25;
const BRACKET_COLUMN_WIDTH_REM = 11;
const BRACKET_CENTER_WIDTH_REM = 12;
const BRACKET_COLUMNS_GAP_REM = 1.25;

const BRACKET_ROUNDS = [
  { key: "Round of 32", count: 16, accent: "text-lime-300" },
  { key: "Round of 16", count: 8, accent: "text-purple-300" },
  { key: "Quarter-final", count: 4, accent: "text-purple-200" },
  { key: "Semi-final", count: 2, accent: "text-lime-200" },
] as const;

const FINAL_ROUND_KEY = "Final";
const THIRD_PLACE_ROUND_KEY = "Play-off for third place";

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

  const roundsByName = new Map(rounds.map((round) => [round.round, round]));
  const leftLeafCount = Math.ceil((roundsByName.get("Round of 32")?.matches.length ?? BRACKET_ROUNDS[0].count) / 2);

  const leftColumns = BRACKET_ROUNDS.map((round, index) => ({
    round: round.key,
    label: round.key,
    accent: round.accent,
    slotHeightRem: BRACKET_BASE_SLOT_HEIGHT * 2 ** index,
    matches: splitRoundMatches(ensureRoundMatches(roundsByName.get(round.key)?.matches, round.count), "left"),
  }));
  const rightColumns = BRACKET_ROUNDS.slice().reverse().map((round) => {
    const originalIndex = BRACKET_ROUNDS.findIndex((entry) => entry.key === round.key);

    return {
      round: round.key,
      label: round.key,
      accent: round.accent,
      slotHeightRem: BRACKET_BASE_SLOT_HEIGHT * 2 ** originalIndex,
      matches: splitRoundMatches(ensureRoundMatches(roundsByName.get(round.key)?.matches, round.count), "right"),
    };
  });
  const finalMatch = ensureRoundMatches(roundsByName.get(FINAL_ROUND_KEY)?.matches, 1, FINAL_ROUND_KEY)[0];
  const thirdPlaceMatch = ensureRoundMatches(roundsByName.get(THIRD_PLACE_ROUND_KEY)?.matches, 1, THIRD_PLACE_ROUND_KEY)[0];
  const bracketHeightRem = leftLeafCount * BRACKET_BASE_SLOT_HEIGHT;
  const bracketMinWidthRem = BRACKET_COLUMN_WIDTH_REM * 8 + BRACKET_CENTER_WIDTH_REM + BRACKET_COLUMNS_GAP_REM * 8;

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-black uppercase tracking-[0.12em] text-gray-500">Swipe sideways to view the full bracket.</p>
      <div className="w-[calc(100vw-2rem)] max-w-full overflow-x-auto pb-2 sm:w-full">
        <div
          className="mx-auto rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)]"
          style={{ minWidth: `${bracketMinWidthRem}rem` }}
        >
          <div className="flex items-start gap-5" style={{ minHeight: `${bracketHeightRem}rem` }}>
            {leftColumns.map((column, index) => (
              <BracketRoundColumn
                key={`left-${column.round}`}
                label={column.label}
                accentClassName={column.accent}
                matches={column.matches}
                slotHeightRem={column.slotHeightRem}
                side="left"
                isFirstRound={index === 0}
                widthRem={BRACKET_COLUMN_WIDTH_REM}
              />
            ))}

            <BracketCenterColumn
              finalMatch={finalMatch}
              thirdPlaceMatch={thirdPlaceMatch}
              heightRem={bracketHeightRem}
              widthRem={BRACKET_CENTER_WIDTH_REM}
            />

            {rightColumns.map((column, index) => (
              <BracketRoundColumn
                key={`right-${column.round}`}
                label={column.label}
                accentClassName={column.accent}
                matches={column.matches}
                slotHeightRem={column.slotHeightRem}
                side="right"
                isFirstRound={index === rightColumns.length - 1}
                widthRem={BRACKET_COLUMN_WIDTH_REM}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BracketRoundColumn({
  label,
  accentClassName,
  matches,
  slotHeightRem,
  side,
  isFirstRound,
  widthRem,
}: {
  label: string;
  accentClassName: string;
  matches: KnockoutBracketMatch[];
  slotHeightRem: number;
  side: "left" | "right";
  isFirstRound: boolean;
  widthRem: number;
}) {
  return (
    <section className="shrink-0" style={{ width: `${widthRem}rem` }}>
      <h3 className={`mb-3 text-center text-[10px] font-black uppercase tracking-[0.18em] ${accentClassName}`}>{label}</h3>
      <div className="flex flex-col">
        {matches.map((match) => (
          <BracketMatchSlot
            key={`${side}-${label}-${match.id}`}
            match={match}
            side={side}
            slotHeightRem={slotHeightRem}
            hasIncoming={!isFirstRound}
            hasOutgoing
          />
        ))}
      </div>
    </section>
  );
}

function BracketMatchSlot({
  match,
  side,
  slotHeightRem,
  hasIncoming,
  hasOutgoing,
}: {
  match: KnockoutBracketMatch;
  side: "left" | "right";
  slotHeightRem: number;
  hasIncoming: boolean;
  hasOutgoing: boolean;
}) {
  const lineStemClass = side === "left" ? "left-0" : "right-0";
  const incomingLineClass =
    side === "left"
      ? "left-0 top-1/2 w-5 border-t border-white/15"
      : "right-0 top-1/2 w-5 border-t border-white/15";
  const outgoingLineClass =
    side === "left"
      ? "right-[-1.25rem] top-1/2 w-5 border-t border-lime-300/20"
      : "left-[-1.25rem] top-1/2 w-5 border-t border-lime-300/20";

  return (
    <div className="relative" style={{ height: `${slotHeightRem}rem` }}>
      {hasIncoming ? (
        <>
          <span className={`pointer-events-none absolute ${lineStemClass} top-0 h-full border-l border-white/10`} />
          <span className={`pointer-events-none absolute ${incomingLineClass}`} />
        </>
      ) : null}
      {hasOutgoing ? <span className={`pointer-events-none absolute ${outgoingLineClass}`} /> : null}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-1">
        <BracketMatchCard match={match} accent={hasIncoming ? "purple" : "lime"} />
      </div>
    </div>
  );
}

function BracketCenterColumn({
  finalMatch,
  thirdPlaceMatch,
  heightRem,
  widthRem,
}: {
  finalMatch: KnockoutBracketMatch;
  thirdPlaceMatch: KnockoutBracketMatch;
  heightRem: number;
  widthRem: number;
}) {
  return (
    <section className="relative shrink-0" style={{ width: `${widthRem}rem`, height: `${heightRem}rem` }}>
      <h3 className="mb-3 text-center text-[10px] font-black uppercase tracking-[0.18em] text-lime-300">Final / Third Place</h3>
      <div className="relative h-[calc(100%-1.5rem)]">
        <div className="absolute inset-x-0 top-[36%] -translate-y-1/2">
          <p className="mb-2 text-center text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">Final</p>
          <div className="relative px-1">
            <span className="pointer-events-none absolute left-[-1.25rem] top-1/2 w-5 border-t border-lime-300/20" />
            <span className="pointer-events-none absolute right-[-1.25rem] top-1/2 w-5 border-t border-lime-300/20" />
            <BracketMatchCard match={finalMatch} accent="lime" />
          </div>
        </div>
        <div className="absolute inset-x-0 top-[72%] -translate-y-1/2">
          <p className="mb-2 text-center text-[10px] font-black uppercase tracking-[0.16em] text-gray-500">Third Place</p>
          <div className="px-1">
            <BracketMatchCard match={thirdPlaceMatch} accent="purple" />
          </div>
        </div>
      </div>
    </section>
  );
}

function BracketMatchCard({ match, accent }: { match: KnockoutBracketMatch; accent: "lime" | "purple" }) {
  const accentClasses =
    accent === "lime"
      ? "border-lime-300/25 shadow-[0_0_24px_rgba(163,230,53,0.08)]"
      : "border-purple-300/20 shadow-[0_0_24px_rgba(168,85,247,0.08)]";

  return (
    <article className={`rounded-xl border bg-[#0b110e]/95 px-2.5 py-2 ${accentClasses}`}>
      <div className="space-y-1">
        <BracketTeamRow name={match.homeTeam} code={match.homeCode} score={match.homeScore} />
        <BracketTeamRow name={match.awayTeam} code={match.awayCode} score={match.awayScore} />
      </div>
      <p className="mt-2 truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">{formatBracketDate(match.date)}</p>
    </article>
  );
}

function BracketTeamRow({
  name,
  code,
  score,
}: {
  name: string | null;
  code: string | null;
  score: number | null;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md bg-white/[0.03] px-2 py-1">
      <div className="min-w-0">
        <p className="truncate text-[11px] font-black uppercase tracking-[0.04em] text-white">{name ?? "TBD"}</p>
        <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-gray-500">{code ?? "TBD"}</p>
      </div>
      <span className="shrink-0 text-xs font-black text-gray-200">{score ?? "—"}</span>
    </div>
  );
}

function ensureRoundMatches(matches: KnockoutBracketMatch[] | undefined, expectedCount: number, round = "Unknown"): KnockoutBracketMatch[] {
  const safeMatches = Array.isArray(matches) ? matches : [];
  const filled = [...safeMatches];

  for (let index = filled.length; index < expectedCount; index += 1) {
    filled.push({
      id: `${round}-placeholder-${index + 1}`,
      round,
      date: null,
      homeTeam: null,
      homeCode: null,
      awayTeam: null,
      awayCode: null,
      homeScore: null,
      awayScore: null,
    });
  }

  return filled.slice(0, expectedCount);
}

function splitRoundMatches(matches: KnockoutBracketMatch[], side: "left" | "right") {
  const midpoint = Math.ceil(matches.length / 2);
  return side === "left" ? matches.slice(0, midpoint) : matches.slice(midpoint);
}

function formatBracketDate(value: string | null) {
  if (!value) {
    return "Date TBD";
  }

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return "Date TBD";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
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
