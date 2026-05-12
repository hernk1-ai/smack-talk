"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SmackTalkLogo } from "@/components/SmackTalkLogo";

const fallbackTeams = ["Chiefs", "Eagles", "Lions", "Lakers", "Cowboys"];

const teamInitials: Record<string, string> = {
  Chiefs: "KC",
  Eagles: "PHI",
  Lions: "DET",
  Lakers: "LAL",
  Cowboys: "DAL",
  "49ers": "SF",
  Ravens: "BAL",
  Bills: "BUF",
  Packers: "GB",
  Bengals: "CIN",
  Dolphins: "MIA",
  Vikings: "MIN",
  Bears: "CHI",
  Steelers: "PIT",
  Broncos: "DEN",
  Raiders: "LV",
  Chargers: "LAC",
  Seahawks: "SEA",
  Jets: "NYJ",
  Buccaneers: "TB",
};

const avatarIcons: Record<string, string> = {
  lightning: "⚡",
  skull: "☠",
  hood: "◒",
  crown: "♛",
  target: "◎",
};

export function EnterArenaPage({
  avatar,
  teams,
  username,
}: {
  avatar?: string;
  teams?: string;
  username?: string;
}) {
  const router = useRouter();
  const cleanUsername = sanitizeUsername(username) || "FadeKing";
  const selectedTeams = parseTeams(teams);
  const avatarIcon = avatarIcons[sanitizeToken(avatar)] ?? avatarIcons.hood;

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#02040a] text-white">
      <EnterArenaAtmosphere />
      <div className="relative z-10 mx-auto flex min-h-dvh w-[min(100%-24px,860px)] flex-col py-5 sm:py-7">
        <EnterArenaHeader />

        <section className="mx-auto flex w-full flex-1 flex-col justify-center py-7 text-center sm:py-9">
          <h1 className="sports-display text-[4.2rem] italic leading-[0.82] tracking-tight text-white drop-shadow-[0_10px_28px_rgba(255,255,255,0.15)] min-[390px]:text-[5.1rem] sm:text-[8rem]">
            The Crowd
            <span className="block bg-gradient-to-r from-lime-300 via-white to-purple-500 bg-clip-text text-transparent">
              Is Calling.
            </span>
          </h1>
          <p className="mt-5 text-base font-black uppercase tracking-[0.18em] text-gray-300 sm:text-xl">
            Your receipts <span className="text-lime-300">start now.</span>
          </p>

          <ProfileSummaryCard avatarIcon={avatarIcon} teams={selectedTeams} username={cleanUsername} />

          <button
            type="button"
            onClick={() => router.push("/app")}
            className="mt-8 min-h-16 w-full rounded-2xl bg-gradient-to-r from-lime-300 via-lime-300 to-purple-500 px-5 text-xl font-black uppercase italic tracking-[0.18em] text-black shadow-[0_0_42px_rgba(132,204,22,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_0_54px_rgba(168,85,247,0.36)] active:scale-[0.99] sm:min-h-20 sm:text-2xl"
          >
            Enter The Arena →
          </button>

          <p className="mt-7 flex items-center justify-center gap-3 text-sm font-black uppercase tracking-[0.16em] text-gray-400 sm:text-base">
            <span className="text-purple-400">▱</span>
            The Arena remembers <span className="text-lime-300">everything.</span>
          </p>
        </section>
      </div>
    </main>
  );
}

function EnterArenaHeader() {
  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      <Link
        href="/onboarding/teams"
        className="justify-self-start text-4xl leading-none text-white transition hover:-translate-x-0.5 hover:text-lime-300"
        aria-label="Back to teams"
      >
        ←
      </Link>
      <Link href="/" className="flex items-center gap-3 transition hover:-translate-y-0.5" aria-label="Smack Talk home">
        <SmackTalkLogo size={58} />
        <div className="brand-lockup text-4xl leading-[0.82]">
          <span className="block text-white">Smack</span>
          <span className="block bg-gradient-to-r from-lime-300 via-white to-purple-400 bg-clip-text text-transparent">
            Talk
          </span>
        </div>
      </Link>
      <div className="justify-self-end text-right">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-white">Step 4 of 4</p>
        <div className="mt-3 flex items-center justify-end gap-2">
          {[0, 1, 2, 3].map((step) => (
            <span key={step} className="flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full ${
                  step === 3
                    ? "border-2 border-lime-300 bg-black shadow-[0_0_14px_rgba(132,204,22,0.5)]"
                    : "bg-lime-300 shadow-[0_0_14px_rgba(132,204,22,0.5)]"
                }`}
              />
              {step < 3 && <span className="h-px w-5 bg-lime-300/65" />}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}

function ProfileSummaryCard({
  avatarIcon,
  teams,
  username,
}: {
  avatarIcon: string;
  teams: string[];
  username: string;
}) {
  return (
    <section className="relative isolate mx-auto mt-8 w-full max-w-3xl overflow-hidden rounded-[1.75rem] border border-purple-300/45 bg-black/58 px-5 py-7 shadow-[0_28px_90px_rgba(0,0,0,0.58),0_0_48px_rgba(168,85,247,0.16)] backdrop-blur-xl sm:px-8 sm:py-9">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(132,204,22,0.16),transparent_18rem),radial-gradient(circle_at_82%_10%,rgba(168,85,247,0.2),transparent_20rem)]" />
      <div className="mx-auto grid h-48 w-48 place-items-center rounded-full border border-white/15 bg-black/45 shadow-[0_0_0_3px_rgba(132,204,22,0.28),0_0_0_5px_rgba(168,85,247,0.24),0_0_50px_rgba(168,85,247,0.22)] sm:h-56 sm:w-56">
        <div className="grid h-36 w-36 place-items-center rounded-full bg-[radial-gradient(circle_at_50%_15%,rgba(168,85,247,0.18),rgba(0,0,0,0.7)_70%)] text-7xl text-lime-300 sm:h-44 sm:w-44 sm:text-8xl">
          {avatarIcon}
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">@{username}</h2>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-lime-300 text-lg font-black text-black">✓</span>
      </div>
      <div className="mx-auto mt-4 w-fit rounded-2xl border border-purple-300/45 bg-purple-500/10 px-8 py-2 text-lg font-black uppercase italic tracking-[0.18em] text-lime-300">
        Rookie
      </div>

      <div className="my-7 flex items-center justify-center gap-5">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-lime-300/40" />
        <p className="shrink-0 text-xs font-black uppercase tracking-[0.24em] text-gray-300">Your Teams</p>
        <span className="h-px flex-1 bg-gradient-to-l from-transparent to-purple-400/40" />
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {teams.map((team) => (
          <div
            key={team}
            className="grid h-16 w-16 place-items-center rounded-2xl border border-white/14 bg-white/[0.035] text-sm font-black text-white shadow-[0_0_22px_rgba(0,0,0,0.34)] sm:h-20 sm:w-20 sm:text-lg"
            title={team}
          >
            {teamInitials[team] ?? team.slice(0, 3).toUpperCase()}
          </div>
        ))}
      </div>

      <div className="mt-7 border-t border-white/10 pt-6">
        <p className="flex items-center justify-center gap-3 text-base font-semibold text-gray-200 sm:text-xl">
          <span className="text-lime-300">◇</span>
          Ready to stand on business.
        </p>
      </div>
    </section>
  );
}

function parseTeams(value?: string) {
  const parsed = (value ?? "")
    .split(",")
    .map((team) => team.trim())
    .filter(Boolean)
    .slice(0, 5);

  return parsed.length > 0 ? parsed : fallbackTeams;
}

function sanitizeUsername(value?: string) {
  return (value ?? "").trim().replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
}

function sanitizeToken(value?: string) {
  return (value ?? "").trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
}

function EnterArenaAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(168,85,247,0.16),transparent_34rem),radial-gradient(circle_at_12%_44%,rgba(132,204,22,0.15),transparent_30rem),linear-gradient(180deg,rgba(2,4,10,0.62),#02040a_78%)]" />
      <div className="absolute left-0 top-0 h-full w-44 bg-[linear-gradient(105deg,rgba(132,204,22,0.14),transparent)] blur-2xl" />
      <div className="absolute right-0 top-0 h-full w-48 bg-[linear-gradient(255deg,rgba(168,85,247,0.2),transparent)] blur-2xl" />
      <div className="absolute left-1/2 top-24 h-72 w-[44rem] -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />
      <div className="absolute inset-x-0 bottom-0 h-[28rem] opacity-30 bg-[repeating-radial-gradient(ellipse_at_50%_100%,rgba(255,255,255,0.12)_0_1px,transparent_1px_18px)] [mask-image:linear-gradient(to_top,#000_0_28%,transparent_78%)]" />
      <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_30%_20%,#fff_0_0.8px,transparent_1px),radial-gradient(circle_at_70%_80%,#fff_0_0.7px,transparent_1px)] bg-[length:14px_14px,19px_19px]" />
    </div>
  );
}
