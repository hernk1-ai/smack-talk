"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { ShareActions } from "@/components/ShareActions";
import { UserAvatar } from "@/components/UserAvatar";
import { buildSiteUrl } from "@/lib/site-url";
import {
  buildRecentPicks,
  buildTournamentRecord,
  getCurrentUserBackingActivity,
  type RecentPickItem,
  type TournamentRecord,
} from "@/lib/supabase/profileActivity";
import { getCurrentUserMatchPicks } from "@/lib/supabase/matchPicks";
import type { Profile } from "@/lib/supabase/types";

type ActivityItem = {
  type: string;
  title: string;
  meta: string;
  icon: string;
  tone: "green" | "purple" | "blue";
};

export function ProfileScreen({ profile }: { profile?: Profile | null }) {
  const [tournamentRecord, setTournamentRecord] = useState<TournamentRecord>({ wins: 0, losses: 0, draws: 0 });
  const [recentPicks, setRecentPicks] = useState<RecentPickItem[]>([]);
  const [teamsBacked, setTeamsBacked] = useState<string[]>([]);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [picksCount, setPicksCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      const [{ picks }, { items: backingItems }] = await Promise.all([
        getCurrentUserMatchPicks(),
        getCurrentUserBackingActivity(6),
      ]);

      if (!mounted) {
        return;
      }

      const record = buildTournamentRecord(picks);
      const recent = buildRecentPicks(picks, 5);
      const backedTeams = [
        ...new Set([
          ...picks.filter((pick) => pick.selected_winner).map((pick) => pick.selected_winner as string),
          ...backingItems.map((item) => item.team).filter(Boolean),
        ]),
      ];

      const pickActivity: ActivityItem[] = recent.map((pick) => ({
        type: "Pick",
        title: pick.team,
        meta: pick.matchLabel,
        icon: pick.result === "hit" ? "✓" : pick.result === "miss" ? "✗" : "◌",
        tone: pick.result === "hit" ? "green" : pick.result === "miss" ? "purple" : "blue",
      }));

      const backingActivity: ActivityItem[] = backingItems.map((item) => ({
        type: "Backing",
        title: item.team,
        meta: "Joined during the match",
        icon: "👍",
        tone: "blue",
      }));

      setTournamentRecord(record);
      setRecentPicks(recent);
      setTeamsBacked(backedTeams.slice(0, 8));
      setPicksCount(picks.filter((pick) => pick.winner_locked_at).length);
      setActivityItems([...pickActivity, ...backingActivity].slice(0, 6));
    }

    loadStats().catch(() => null);

    return () => {
      mounted = false;
    };
  }, []);

  const recordLabel = useMemo(
    () => `${tournamentRecord.wins}–${tournamentRecord.losses}–${tournamentRecord.draws}`,
    [tournamentRecord],
  );

  return (
    <div className="page-rhythm">
      <ProfileHeader profile={profile} />
      <ProfileIdentityCard profile={profile} />
      {!profile?.onboarding_completed ? <CompleteProfilePrompt /> : null}
      <TournamentRecordSection recordLabel={recordLabel} picksCount={picksCount} />
      <RecentPicksSection picks={recentPicks} />
      <TeamsBackedSection teams={teamsBacked} />
      <MatchActivitySection items={activityItems} profile={profile} />
    </div>
  );
}

function CompleteProfilePrompt() {
  return (
    <section className="rounded-[1.75rem] border border-lime-300/25 bg-lime-400/[0.06] p-4 shadow-[0_18px_52px_rgba(0,0,0,0.28)]">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-lime-300">Complete Profile</p>
      <h2 className="sports-display mt-2 text-3xl italic leading-none text-white">Make it yours.</h2>
      <p className="mt-2 text-sm font-semibold text-gray-300">
        Choose your avatar, pick your countries, and customize your Lockt profile.
      </p>
      <Link
        href="/onboarding/profile-pic"
        className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl border border-lime-300/40 bg-lime-400/10 px-3 text-[11px] font-black uppercase tracking-[0.1em] text-lime-100 transition hover:bg-lime-400/20"
      >
        Complete Profile
      </Link>
    </section>
  );
}

function ProfileHeader({ profile }: { profile?: Profile | null }) {
  return <AppHeader profile={profile} subtitle="Your World Cup profile · picks and match activity." rightAriaLabel="Account" />;
}

function ProfileIdentityCard({ profile }: { profile?: Profile | null }) {
  const username = profile?.username || profile?.display_name || "Fan";
  const initials = getInitials(username);

  return (
    <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/40 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.45)] transition hover:border-white/15 sm:p-5">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_14%_18%,rgba(132,204,22,0.2),transparent_30%),radial-gradient(circle_at_86%_18%,rgba(168,85,247,0.2),transparent_34%)]" />

      <Link
        href="/settings"
        aria-label="Settings"
        className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-lg text-gray-200 transition hover:-translate-y-0.5 hover:border-purple-300/40 hover:bg-purple-500/10 active:scale-95"
      >
        ⚙
      </Link>

      <div className="grid gap-5 pr-12 md:grid-cols-[auto_1fr] md:items-center md:pr-14">
        <div className="relative mx-auto md:mx-0">
          <UserAvatar
            avatarUrl={profile?.avatar_url}
            initials={initials}
            label={`${username} profile avatar`}
            size="xl"
            active
          />
          <span className="absolute bottom-2 right-0 h-5 w-5 rounded-full border-2 border-black bg-lime-400 shadow-[0_0_18px_rgba(132,204,22,0.9)]" />
        </div>

        <div className="min-w-0 text-center md:text-left">
          <p className="text-3xl font-black italic leading-none text-white sm:text-4xl">@{username}</p>
          <p className="mx-auto mt-3 max-w-lg text-sm font-semibold leading-6 text-gray-300 md:mx-0">
            Pick your team. Follow the score. See if you called it.
          </p>
          {profile?.favorite_teams?.length ? (
            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.14em] text-lime-300">
              Following {profile.favorite_teams.slice(0, 4).join(", ")}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function TournamentRecordSection({ recordLabel, picksCount }: { recordLabel: string; picksCount: number }) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-black/35 p-4 shadow-[0_18px_52px_rgba(0,0,0,0.38)]">
      <SectionHeader eyebrow="Tournament Record" title={recordLabel} action="W–L–D" />
      <p className="mt-2 text-sm font-semibold text-gray-400">
        {picksCount > 0
          ? `${picksCount} pre-match ${picksCount === 1 ? "pick" : "picks"} counted toward your record.`
          : "Pick a winner before kickoff to start your tournament record."}
      </p>
    </section>
  );
}

function RecentPicksSection({ picks }: { picks: RecentPickItem[] }) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-black/35 p-4 shadow-[0_18px_52px_rgba(0,0,0,0.38)]">
      <SectionHeader eyebrow="Recent Picks" title="Pre-Match Picks" action="" />
      {picks.length ? (
        <ul className="mt-4 space-y-2">
          {picks.map((pick) => (
            <li
              key={`${pick.matchLabel}-${pick.team}`}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-black/45 px-3 py-2"
            >
              <div>
                <p className="text-sm font-black text-white">{pick.team}</p>
                <p className="text-xs font-semibold text-gray-400">{pick.matchLabel}</p>
              </div>
              <span className="text-lg font-black text-lime-300">
                {pick.result === "hit" ? "✓" : pick.result === "miss" ? "✗" : "◌"}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm font-semibold text-gray-400">No pre-match picks yet. Back a team before kickoff in any Game Room.</p>
      )}
    </section>
  );
}

function TeamsBackedSection({ teams }: { teams: string[] }) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-black/35 p-4 shadow-[0_18px_52px_rgba(0,0,0,0.38)]">
      <SectionHeader eyebrow="Teams Backed" title="Your Sides" action="" />
      {teams.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {teams.map((team) => (
            <span
              key={team}
              className="rounded-lg border border-lime-300/30 bg-lime-400/10 px-3 py-1.5 text-xs font-black uppercase text-lime-200"
            >
              {team}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm font-semibold text-gray-400">Teams you back in Game Rooms will show up here.</p>
      )}
    </section>
  );
}

function MatchActivitySection({ items, profile }: { items: ActivityItem[]; profile?: Profile | null }) {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-black/35 p-4 shadow-[0_18px_52px_rgba(0,0,0,0.38)]">
      <SectionHeader
        eyebrow="Match Activity"
        title="Latest From You"
        action={shareOpen ? "Hide Share" : "Share"}
        onAction={() => setShareOpen((current) => !current)}
      />
      {shareOpen ? (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/45 p-3">
          <ShareActions
            type="profile"
            title="Share Profile"
            text={`Follow ${profile?.username ?? "my"} World Cup picks on Lockt.`}
            caption={`Follow ${profile?.username ?? "my"} World Cup picks on Lockt.`}
            url={buildSiteUrl("/profile")}
          />
        </div>
      ) : null}
      {items.length ? (
        <div className="mt-4 grid gap-3">
          {items.map((item, index) => (
            <ActivityRow key={`${item.type}-${item.title}-${index}`} item={item} />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm font-semibold text-gray-400">
          Join a Game Room, back a team, and chat during a match to build your activity.
        </p>
      )}
    </section>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const toneClass = {
    green: "border-lime-300/25 bg-lime-400/10 text-lime-300",
    purple: "border-purple-300/25 bg-purple-500/10 text-purple-300",
    blue: "border-sky-300/25 bg-sky-500/10 text-sky-300",
  }[item.tone];

  return (
    <article className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-2xl border border-white/10 bg-black/45 p-3">
      <span className={`grid h-10 w-10 place-items-center rounded-xl border text-base ${toneClass}`}>{item.icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">{item.type}</p>
        <h3 className="mt-1 truncate text-sm font-black text-white">{item.title}</h3>
        <p className="mt-0.5 truncate text-xs font-semibold text-gray-400">{item.meta}</p>
      </div>
    </article>
  );
}

function SectionHeader({
  eyebrow,
  title,
  action,
  onAction,
}: {
  eyebrow: string;
  title: string;
  action: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lime-300">{eyebrow}</p>
        <h2 className="sports-display mt-1 text-2xl italic leading-none text-white sm:text-3xl">{title}</h2>
      </div>
      {action ? (
        <button
          type="button"
          onClick={onAction}
          className="rounded-full px-2 py-1 text-xs font-black uppercase text-purple-300 transition hover:bg-purple-500/10 hover:text-purple-100 active:scale-95"
        >
          {action}
        </button>
      ) : null}
    </div>
  );
}

function getInitials(username: string) {
  const cleanUsername = username.replace(/^@/, "").trim();
  const capitalLetters = cleanUsername.match(/[A-Z]/g);

  if (capitalLetters && capitalLetters.length > 1) {
    return capitalLetters.slice(0, 2).join("");
  }

  return cleanUsername.slice(0, 2).toUpperCase() || "ST";
}
