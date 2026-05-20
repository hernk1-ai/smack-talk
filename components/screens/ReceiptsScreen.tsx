"use client";

import { type KeyboardEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { ShareActions } from "@/components/ShareActions";
import { FollowButton } from "@/components/social/FollowButton";
import { UserAvatar } from "@/components/UserAvatar";
import { getSeededReceiptsByUsername, type SeededReceipt } from "@/data/seededCrowd";
import {
  getActivityAlerts,
  getCurrentWinStreak,
  getHeatStatus,
  getHitRate,
  getReputationBadges,
  getReputationLevel,
  type ReputationBadge,
} from "@/lib/reputation";
import { getCurrentUserReceipts, getReceiptsByUser } from "@/lib/supabase/receipts";
import { getCurrentUserMatchPicks } from "@/lib/supabase/matchPicks";
import { getFollowingUserIds } from "@/lib/supabase/follows";
import { getCurrentUserTakes } from "@/lib/supabase/takes";
import type { Profile, Receipt } from "@/lib/supabase/types";
import { ReportModal } from "@/components/moderation/ReportModal";
import { buildSiteUrl } from "@/lib/site-url";
import { isPreTournamentMode } from "@/lib/productConfig";
import { getUserFacingErrorMessage } from "@/lib/userFacingError";

type ReceiptStatus = "win" | "loss";
type ReceiptSide = "riding" | "fading";

type RecentReceipt = {
  id: string;
  status: ReceiptStatus;
  timestamp: string;
  handle: string;
  avatar: string;
  take: string;
  arena: string;
  leftTeam: string;
  leftScore: string;
  rightTeam: string;
  rightScore: string;
  crowdResult: string;
  side: ReceiptSide;
  verdict: string;
  heat: string;
  views: string;
};

type ViralReceipt = {
  id: string;
  rank: number;
  hitRate: string;
  handle: string;
  avatar: string;
  take: string;
  arena: string;
  views: string;
  heat: string;
  comments: string;
  status: ReceiptStatus;
};

type PerformanceBadge = ReputationBadge;

export type ReceiptOwner = {
  userId?: string | null;
  username: string;
  avatarUrl?: string | null;
  reputation?: number | null;
  favoriteTeams?: string[] | null;
  accountVisibility?: "public" | "private";
  followersCount?: number;
  followingCount?: number;
  currentFollowStatus?: "active" | "pending" | "blocked" | null;
  canViewReceipts?: boolean;
};

type ReceiptOwnerMeta = {
  userId?: string | null;
  handle: string;
  initials: string;
  avatarUrl?: string | null;
  reputation?: number | null;
  isCurrentUser: boolean;
  accountVisibility: "public" | "private";
  followersCount: number;
  followingCount: number;
  currentFollowStatus: "active" | "pending" | "blocked" | null;
  canViewReceipts: boolean;
};

const recentReceipts: RecentReceipt[] = [
  {
    id: "curry-win",
    status: "win",
    timestamp: "2h ago",
    handle: "@TalkHeavy23",
    avatar: "TH",
    take: "USA gets the opener done.",
    arena: "World Cup Group Stage",
    leftTeam: "USA",
    leftScore: "2",
    rightTeam: "PAR",
    rightScore: "1",
    crowdResult: "97% Riding",
    side: "riding",
    verdict: "Your take hit",
    heat: "2.4K",
    views: "1.2M",
  },
  {
    id: "lakers-loss",
    status: "loss",
    timestamp: "1d ago",
    handle: "@BucketsOnly",
    avatar: "BO",
    take: "Mexico scores first.",
    arena: "World Cup Group Stage",
    leftTeam: "USA",
    leftScore: "0",
    rightTeam: "NED",
    rightScore: "1",
    crowdResult: "81% Fading",
    side: "fading",
    verdict: "Take missed",
    heat: "1.1K",
    views: "532K",
  },
  {
    id: "knicks-win",
    status: "win",
    timestamp: "2d ago",
    handle: "@MidRange",
    avatar: "MR",
    take: "Paraguay can steal this.",
    arena: "World Cup Group Stage",
    leftTeam: "MEX",
    leftScore: "3",
    rightTeam: "RSA",
    rightScore: "2",
    crowdResult: "92% Riding",
    side: "riding",
    verdict: "Your take hit",
    heat: "3.6K",
    views: "1.8M",
  },
  {
    id: "fade-crowd-win",
    status: "win",
    timestamp: "3d ago",
    handle: "@FadeKing",
    avatar: "FK",
    take: "Locked before kickoff.",
    arena: "World Cup Group Stage",
    leftTeam: "RSA",
    leftScore: "1",
    rightTeam: "KOR",
    rightScore: "0",
    crowdResult: "89% Fading",
    side: "fading",
    verdict: "Your fade hit",
    heat: "2.2K",
    views: "912K",
  },
];

const viralReceipts: ViralReceipt[] = [
  {
    id: "viral-curry",
    rank: 1,
    hitRate: "97%",
    handle: "@TalkHeavy23",
    avatar: "TH",
    take: "USA gets the opener done.",
    arena: "World Cup Group Stage",
    views: "2.4M",
    heat: "12.6K",
    comments: "4.3K",
    status: "win",
  },
  {
    id: "viral-knicks",
    rank: 2,
    hitRate: "94%",
    handle: "@MidRange",
    avatar: "MR",
    take: "Paraguay can steal this.",
    arena: "World Cup Group Stage",
    views: "1.8M",
    heat: "8.9K",
    comments: "3.2K",
    status: "win",
  },
  {
    id: "viral-denver",
    rank: 3,
    hitRate: "91%",
    handle: "@FadeKing",
    avatar: "FK",
    take: "France tops their group.",
    arena: "World Cup Group Stage",
    views: "1.2M",
    heat: "6.4K",
    comments: "2.1K",
    status: "win",
  },
  {
    id: "viral-lakers",
    rank: 4,
    hitRate: "9%",
    handle: "@BucketsOnly",
    avatar: "BO",
    take: "Mexico scores first.",
    arena: "World Cup Group Stage",
    views: "842K",
    heat: "3.1K",
    comments: "1.6K",
    status: "loss",
  },
];

export function ReceiptsScreen({
  profile,
  recordOwner,
}: {
  profile?: Profile | null;
  recordOwner?: ReceiptOwner | null;
}) {
  const router = useRouter();
  const owner = getReceiptOwner(profile, recordOwner);
  const currentUser = owner;
  const [realReceipts, setRealReceipts] = useState<Receipt[]>([]);
  const [followingReceipts, setFollowingReceipts] = useState<Receipt[]>([]);
  const [activeTab, setActiveTab] = useState<"mine" | "following">("mine");
  const [myLockedTakes, setMyLockedTakes] = useState<Array<{ id: string; take_text: string; created_at: string; game_id: string; ride_count: number; fade_count: number }>>([]);
  const [myMatchPicks, setMyMatchPicks] = useState<
    Array<{
      id: string;
      home_team: string | null;
      away_team: string | null;
      selected_winner: string | null;
      home_score: number | null;
      away_score: number | null;
      stage: string | null;
      created_at: string;
      winner_locked_at: string | null;
      exact_score_locked_at: string | null;
      winner_result: "pending" | "hit" | "miss";
      exact_score_result: "pending" | "hit" | "miss";
      winner_rep_delta: number;
      exact_score_rep_delta: number;
      status: "locked" | "settled";
    }>
  >([]);
  const [receiptError, setReceiptError] = useState("");
  const [reportProfileOpen, setReportProfileOpen] = useState(false);
  const preTournamentMode = isPreTournamentMode();

  useEffect(() => {
    let isMounted = true;

    async function loadReceipts() {
      if (!owner.canViewReceipts) {
        setRealReceipts([]);
        setFollowingReceipts([]);
        setReceiptError("");
        return;
      }

      const { receipts, error } = owner.isCurrentUser
        ? await getCurrentUserReceipts()
        : owner.userId
          ? await getReceiptsByUser(owner.userId)
          : { receipts: [] as Receipt[], error: null };

      if (!isMounted) {
        return;
      }

      setRealReceipts(receipts);
      setReceiptError(error ? getUserFacingErrorMessage(error, "Could not load receipts right now.") : "");

      if (owner.isCurrentUser) {
        const [{ takes }, { picks }, { userIds }] = await Promise.all([getCurrentUserTakes(), getCurrentUserMatchPicks(), getFollowingUserIds()]);
        setMyLockedTakes(
          takes.map((take) => ({
            id: take.id,
            take_text: take.take_text,
            created_at: take.created_at,
            game_id: take.game_id,
            ride_count: take.ride_count,
            fade_count: take.fade_count,
          })),
        );
        setMyMatchPicks(
          picks.map((pick) => ({
            id: pick.id,
            home_team: pick.home_team,
            away_team: pick.away_team,
            selected_winner: pick.selected_winner,
            home_score: pick.home_score,
            away_score: pick.away_score,
            stage: pick.stage,
            created_at: pick.created_at,
            winner_locked_at: pick.winner_locked_at,
            exact_score_locked_at: pick.exact_score_locked_at,
            winner_result: pick.winner_result,
            exact_score_result: pick.exact_score_result,
            winner_rep_delta: pick.winner_rep_delta,
            exact_score_rep_delta: pick.exact_score_rep_delta,
            status: pick.status,
          })),
        );

        if (userIds.length) {
          const loadFollowing = await Promise.all(userIds.map((userId) => getReceiptsByUser(userId)));
          setFollowingReceipts(loadFollowing.flatMap((item) => item.receipts));
        } else {
          setFollowingReceipts([]);
        }
      }
    }

    loadReceipts();

    return () => {
      isMounted = false;
    };
  }, [owner.isCurrentUser, owner.userId, owner.canViewReceipts]);

  const recentReceiptCards = useMemo(
    () => {
      if (realReceipts.length) {
        return realReceipts.map((receipt) => mapReceiptToRecent(receipt, owner));
      }

      if (preTournamentMode) {
        return [];
      }

      const seededReceipts = getSeededReceiptsByUsername(owner.handle);
      return seededReceipts.length ? seededReceipts.map((receipt) => mapSeededReceiptToRecent(receipt, owner)) : recentReceipts;
    },
    [owner, preTournamentMode, realReceipts],
  );
  const proofHighlightCards = useMemo(() => {
    if (preTournamentMode) {
      return [];
    }
    const seededReceipts = realReceipts.length ? [] : getSeededReceiptsByUsername(owner.handle);
    return seededReceipts.length ? seededReceipts.map((receipt, index) => mapSeededReceiptToViral(receipt, owner, index)) : viralReceipts;
  }, [owner, preTournamentMode, realReceipts.length]);
  const featuredReceipt = realReceipts[0] ?? null;

  function openReceiptDetail(receiptId: string) {
    router.push(`/receipt/${encodeURIComponent(receiptId)}`);
  }

  return (
    <div className="page-rhythm">
      <ReceiptsHeader profile={profile} />
      <ReceiptIdentityCard
        featuredReceipt={featuredReceipt}
        owner={owner}
        profile={profile}
        receipts={realReceipts}
      />

      {receiptError && (
        <p className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-red-200">
          {receiptError}
        </p>
      )}

      {!owner.canViewReceipts ? (
        <section className="rounded-[1.75rem] border border-white/10 bg-black/30 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.34)] backdrop-blur">
          <h2 className="sports-display text-2xl italic leading-none text-white sm:text-3xl">This account is private.</h2>
          <p className="mt-2 text-sm font-semibold text-gray-300">Follow this user to see their receipts.</p>
          <div className="mt-3">
            <FollowButton
              targetUserId={owner.userId}
              targetAccountVisibility={owner.accountVisibility}
              currentFollowStatus={owner.currentFollowStatus}
            />
          </div>
        </section>
      ) : null}

      {owner.isCurrentUser ? (
        <section className="rounded-2xl border border-white/10 bg-black/30 p-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("mine")}
              className={`min-h-10 rounded-xl border text-xs font-black uppercase tracking-[0.1em] ${activeTab === "mine" ? "border-lime-300/50 bg-lime-400/10 text-lime-200" : "border-white/15 bg-white/[0.03] text-gray-300"}`}
            >
              My Receipts
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("following")}
              className={`min-h-10 rounded-xl border text-xs font-black uppercase tracking-[0.1em] ${activeTab === "following" ? "border-purple-300/50 bg-purple-500/10 text-purple-200" : "border-white/15 bg-white/[0.03] text-gray-300"}`}
            >
              Following
            </button>
          </div>
        </section>
      ) : null}

      {owner.canViewReceipts && activeTab === "following" ? (
        <ReceiptSection title="Following" icon="◉" action="">
          {followingReceipts.length ? (
            <div className="space-y-2">
              {followingReceipts.slice(0, 20).map((receipt) => {
                const mapped = mapReceiptToRecent(receipt, owner);
                return (
                  <article key={receipt.id} className="rounded-2xl border border-white/10 bg-black/45 p-3">
                    <p className="text-sm font-black text-white">{mapped.take}</p>
                    <p className="mt-1 text-xs font-semibold text-gray-300">{mapped.arena}</p>
                    <p className="mt-1 text-[11px] font-semibold text-gray-500">{mapped.timestamp}</p>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-black/45 p-4">
              <p className="text-sm font-semibold text-gray-300">
                No receipts from people you follow yet. Follow users to build your World Cup feed.
              </p>
            </div>
          )}
        </ReceiptSection>
      ) : owner.canViewReceipts && preTournamentMode ? (
        myLockedTakes.length || myMatchPicks.length ? (
          <>
            {myMatchPicks.length ? (
              <ReceiptSection title="Match Picks" icon="◷" action="">
                <div className="space-y-2">
                  {myMatchPicks.slice(0, 12).map((pick) => (
                    <article key={pick.id} className="rounded-2xl border border-white/10 bg-black/45 p-3">
                      <p className="text-sm font-black text-white">
                        {pick.home_team ?? "Home"} vs {pick.away_team ?? "Away"}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-gray-300">
                        Winner: {pick.selected_winner ?? "Not locked"} · Score{" "}
                        {pick.home_score ?? "—"}-{pick.away_score ?? "—"}
                      </p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-lime-300">Locked before kickoff</p>
                      <p className="mt-1 text-xs font-semibold text-gray-400">
                        {pick.status === "settled" ? "Settled" : "Receipt pending"}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-gray-500">
                        Match Pick · {pick.stage ?? "World Cup"} · {formatReceiptAge(pick.created_at)}
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-black uppercase">
                        <span className="rounded-md border border-lime-300/25 bg-lime-400/10 px-2 py-1 text-lime-200">
                          Winner {pick.winner_result} ({formatSignedRep(pick.winner_rep_delta)}) / +50 -25
                        </span>
                        <span className="rounded-md border border-purple-300/25 bg-purple-500/10 px-2 py-1 text-purple-200">
                          Exact {pick.exact_score_result} ({formatSignedRep(pick.exact_score_rep_delta)}) / +100 -50
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] font-semibold text-gray-400">
                        Total REP this match: {formatSignedRep(pick.winner_rep_delta + pick.exact_score_rep_delta)}
                      </p>
                    </article>
                  ))}
                </div>
              </ReceiptSection>
            ) : null}
            {myLockedTakes.length ? (
              <ReceiptSection title="Locked Takes" icon="▤" action="">
                <div className="space-y-2">
                  {myLockedTakes.slice(0, 12).map((take) => {
                    const total = Math.max(take.ride_count + take.fade_count, 1);
                    const ridePercent = Math.round((take.ride_count / total) * 100);
                    const fadePercent = 100 - ridePercent;
                    return (
                      <article key={take.id} className="rounded-2xl border border-white/10 bg-black/45 p-3">
                        <p className="text-sm font-black text-white">{take.take_text}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.1em] text-lime-300">Locked before kickoff</p>
                        <p className="mt-1 text-xs font-semibold text-gray-400">Receipt pending</p>
                        <p className="mt-1 text-[11px] font-semibold text-gray-500">{formatReceiptAge(take.created_at)} · {take.game_id.replaceAll("-", " ")}</p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-black uppercase">
                          <span className="rounded-md border border-lime-300/25 bg-lime-400/10 px-2 py-1 text-lime-200">Ride {ridePercent}%</span>
                          <span className="rounded-md border border-purple-300/25 bg-purple-500/10 px-2 py-1 text-purple-200">Fade {fadePercent}%</span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </ReceiptSection>
            ) : null}
          </>
        ) : (
          <ReceiptSection title="Your receipt board is empty." icon="▤" action="Make My First Call">
            <div className="rounded-2xl border border-white/10 bg-black/45 p-4">
              <p className="text-sm font-semibold text-gray-300">
                Make your first World Cup call to unlock 200 Starter Rep and your First Lock Trophy.
              </p>
            </div>
          </ReceiptSection>
        )
      ) : owner.canViewReceipts ? (
        <>
          <ReceiptSection title="Recent Receipts" icon="▤" action="See all">
            <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
              {recentReceiptCards.map((receipt, index) => (
                <RecentReceiptCard
                  key={receipt.id}
                  receipt={receipt}
                  currentUser={index === 0 ? currentUser : undefined}
                  onOpen={openReceiptDetail}
                />
              ))}
            </div>
          </ReceiptSection>

          <ReceiptSection title="Proof Highlights" icon="◇" action="See all">
            <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
              {proofHighlightCards.map((receipt, index) => (
                <ViralReceiptCard
                  key={receipt.id}
                  receipt={receipt}
                  currentUser={index === 0 ? currentUser : undefined}
                  onOpen={openReceiptDetail}
                />
              ))}
            </div>
          </ReceiptSection>
        </>
      ) : null}
      <section className="rounded-[1.75rem] border border-white/10 bg-black/30 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.34)] backdrop-blur">
        <h2 className="sports-display text-2xl italic leading-none text-white sm:text-3xl">Top Talkers Coming Soon</h2>
        <p className="mt-2 text-sm font-semibold text-gray-300">
          See who is building the strongest LOCKT reputation when rankings go live.
        </p>
        <span className="mt-3 inline-block rounded-full border border-purple-300/35 bg-purple-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.1em] text-purple-200">
          Coming Soon
        </span>
      </section>
    <ReportModal
      open={reportProfileOpen && Boolean(owner.userId)}
      onClose={() => setReportProfileOpen(false)}
      targetType="user"
      targetId={owner.userId ?? ""}
    />
    </div>
  );
}

function ReceiptsHeader({ profile }: { profile?: Profile | null }) {
  return <AppHeader profile={profile} subtitle="Profile · Trophies · Receipts" rightAriaLabel="Profile" />;
}

function ReceiptIdentityCard({
  featuredReceipt,
  owner,
  profile,
  receipts,
}: {
  featuredReceipt: Receipt | null;
  owner: ReceiptOwnerMeta;
  profile?: Profile | null;
  receipts: Receipt[];
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const receiptCount = receipts.length || profile?.receipts_count || 0;
  const wins = receipts.length ? receipts.filter((receipt) => receipt.result === "hit").length : profile?.hits_count ?? 0;
  const losses = receipts.length ? receipts.filter((receipt) => receipt.result === "miss").length : profile?.misses_count ?? 0;
  const hitRateValue = getHitRate(wins, losses);
  const hitRate = `${hitRateValue}%`;
  const streak = receipts.length ? getCurrentWinStreak(receipts) : 0;
  const createdTakes = profile?.created_takes_count ?? 0;
  const receiptsCount = receiptCount;
  const reputation = owner.reputation ?? profile?.reputation_score ?? profile?.reputation ?? 0;
  const totalHeat = receipts.reduce((sum, receipt) => sum + receipt.heat, 0);
  const totalRides = receipts.reduce((sum, receipt) => sum + receipt.ride_count, 0);
  const totalFades = receipts.reduce((sum, receipt) => sum + receipt.fade_count, 0);
  const totalReplies = receipts.reduce((sum, receipt) => sum + receipt.reply_count, 0);
  const level = getReputationLevel(reputation, createdTakes + receiptsCount);
  const heatStatus = getHeatStatus({ heat: totalHeat, reputation, streak });
  const badges = getReputationBadges({
    reputation,
    wins,
    losses,
    takes: createdTakes,
    receipts: receiptsCount,
    streak,
    heat: totalHeat,
    rideCount: totalRides,
    fadeCount: totalFades,
    replyCount: totalReplies,
  });
  const activityAlerts = getActivityAlerts(
    {
      reputation,
      wins,
      losses,
      takes: createdTakes,
      receipts: receiptsCount,
      streak,
      heat: totalHeat,
      rideCount: totalRides,
      fadeCount: totalFades,
      replyCount: totalReplies,
    },
    badges,
  );
  void featuredReceipt;

  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] border border-lime-300/25 bg-[#05070d]/90 p-4 shadow-[0_30px_90px_rgba(0,0,0,0.56),0_0_48px_rgba(132,204,22,0.1)] sm:p-5">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_12%,rgba(132,204,22,0.2),transparent_34%),radial-gradient(circle_at_86%_18%,rgba(168,85,247,0.22),transparent_34%),linear-gradient(135deg,rgba(132,204,22,0.1),transparent_40%,rgba(168,85,247,0.11))]" />
      <div className="pointer-events-none absolute inset-x-5 top-32 -z-10 h-px bg-gradient-to-r from-transparent via-lime-300/30 to-transparent" />

      <div className="grid gap-5">
        <div className="min-w-0 space-y-4">
          <div className="grid gap-4 min-[460px]:grid-cols-[auto_1fr] min-[460px]:items-center">
            <UserAvatar avatarUrl={owner.avatarUrl} initials={owner.initials} label={`${owner.handle} avatar`} size="xl" active />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lime-300">The record is the identity.</p>
              <h2 className="mt-2 truncate text-4xl font-black italic leading-none text-white sm:text-5xl">{owner.handle}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-lg border border-lime-300/40 bg-lime-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-lime-300">
                  {level.title}
                </span>
                <span className="rounded-lg border border-purple-300/35 bg-purple-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-purple-200">
                  Level {level.level}
                </span>
                <span className="rounded-lg border border-white/10 bg-black/45 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-gray-300">
                  Heat Status: {heatStatus.label}
                </span>
                <button
                  type="button"
                  onClick={() => setShareOpen((current) => !current)}
                  className="rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-gray-300 transition hover:border-purple-300/35 hover:text-purple-200"
                >
                  {shareOpen ? "Hide Share" : "Share"}
                </button>
                {owner.isCurrentUser ? (
                  <Link
                    href="/settings"
                    className="rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-gray-300 transition hover:border-lime-300/35 hover:text-lime-200"
                  >
                    Settings
                  </Link>
                ) : null}
              </div>
              {shareOpen ? (
                <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-2">
                  <ShareActions
                    type="profile"
                    title="Share Profile"
                    text="Follow my World Cup calls on Lockt."
                    caption={`${owner.handle} is building a World Cup receipt board on Lockt.`}
                    url={buildSiteUrl(`/receipts/${encodeURIComponent(owner.handle.replace(/^@/, "").toLowerCase())}`)}
                  />
                </div>
              ) : null}
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-gray-300">
                Your record follows you. Receipts don&apos;t lie. Permanent game calls, settled outcomes, and the REP trail behind every lock.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 min-[460px]:grid-cols-4 lg:grid-cols-7">
            <IdentityStat label="REP" value={formatCompact(reputation)} tone="text-lime-300" />
            <IdentityStat label="Hit %" value={hitRate} tone="text-white" />
            <IdentityStat label="Wins" value={String(wins)} tone="text-lime-300" />
            <IdentityStat label="Losses" value={String(losses)} tone="text-purple-300" />
            <IdentityStat label="Streak" value={streak >= 3 ? `${streak}W Hot` : `${streak}W`} tone="text-lime-200" />
            <IdentityStat label="Takes" value={formatCompact(createdTakes)} tone="text-gray-100" />
            <IdentityStat label="Receipts" value={formatCompact(receiptsCount)} tone="text-purple-200" />
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-black/45 p-2">
            <IdentityMiniMeta label="Followers" value={formatCompact(owner.followersCount)} href={owner.isCurrentUser ? "/followers" : undefined} />
            <IdentityMiniMeta label="Following" value={formatCompact(owner.followingCount)} href={owner.isCurrentUser ? "/following" : undefined} />
            <IdentityMiniMeta label="Crew" value="Soon" />
          </div>
          {!owner.isCurrentUser ? (
            <div className="rounded-xl border border-white/10 bg-black/45 p-3">
              <FollowButton
                targetUserId={owner.userId}
                targetAccountVisibility={owner.accountVisibility}
                currentFollowStatus={owner.currentFollowStatus}
              />
            </div>
          ) : null}

          <div className="rounded-[1.4rem] border border-white/10 bg-black/45 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lime-300">Trophy Case</p>
                <h3 className="sports-display mt-1 text-2xl italic leading-none text-white">Trophies Earned</h3>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-purple-300">Trophy board</p>
            </div>
            <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 lg:grid lg:grid-cols-5 lg:overflow-visible">
              {badges.map((badge) => (
                <PerformanceBadgeCard key={badge.name} badge={badge} compact />
              ))}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {activityAlerts.map((alert) => (
              <div key={alert} className="rounded-2xl border border-lime-300/15 bg-lime-400/[0.06] px-3 py-2">
                <p className="truncate text-[10px] font-black uppercase tracking-[0.1em] text-lime-200">ϟ {alert}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function IdentityStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/45 p-3">
      <p className="truncate text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">{label}</p>
      <p className={`scoreboard-number mt-2 truncate text-2xl sm:text-3xl ${tone}`}>{value}</p>
    </div>
  );
}

function IdentityMiniMeta({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <>
      <p className="truncate text-[9px] font-black uppercase tracking-[0.08em] text-gray-500">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-gray-100">{value}</p>
    </>
  );

  if (!href) {
    return <div className="min-w-0 rounded-xl border border-white/10 bg-black/35 px-2 py-2 text-center">{content}</div>;
  }

  return (
    <Link href={href} className="min-w-0 rounded-xl border border-white/10 bg-black/35 px-2 py-2 text-center transition hover:border-lime-300/35 hover:bg-lime-400/10">
      {content}
    </Link>
  );
}

function ReceiptSection({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: string;
  action?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-black/30 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.34)] backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <h2 className="sports-display text-2xl italic leading-none text-white sm:text-3xl">
          <span className="mr-2 not-italic">{icon}</span>
          {title}
        </h2>
        {action ? (
          <button type="button" className="rounded-full px-2 py-1 text-xs font-black uppercase text-purple-300 transition hover:bg-purple-500/10 hover:text-purple-100 active:scale-95">
            {action} ›
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function RecentReceiptCard({
  receipt,
  currentUser,
  onOpen,
}: {
  receipt: RecentReceipt;
  currentUser?: ReceiptOwnerMeta;
  onOpen: (receiptId: string) => void;
}) {
  const [showShare, setShowShare] = useState(false);
  const isWin = receipt.status === "win";
  const handle = currentUser?.handle ?? receipt.handle;
  const handleOpenKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(receipt.id);
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(receipt.id)}
      onKeyDown={handleOpenKeyDown}
      className={`min-w-[72vw] max-w-[15rem] snap-start rounded-2xl border bg-black/45 p-3 shadow-[0_18px_45px_rgba(0,0,0,0.34)] transition hover:-translate-y-1 active:scale-[0.985] sm:min-w-[13.75rem] ${
        isWin
          ? "border-lime-300/35 hover:shadow-[0_20px_52px_rgba(132,204,22,0.12)]"
          : "border-red-300/35 hover:shadow-[0_20px_52px_rgba(248,113,113,0.1)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`rounded-md px-2 py-1 text-[10px] font-black uppercase ${
            isWin ? "bg-lime-400/15 text-lime-300" : "bg-red-500/15 text-red-300"
          }`}
        >
          {receipt.status}
        </span>
        <span className="text-[10px] font-bold text-gray-500">{receipt.timestamp}</span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Link
          href={getReceiptHref(handle, Boolean(currentUser))}
          onClick={(event) => event.stopPropagation()}
          className="rounded-full transition hover:scale-105 active:scale-95"
          aria-label={`${handle} receipts`}
        >
          <UserAvatar
            avatarUrl={currentUser?.avatarUrl}
            initials={currentUser?.initials ?? receipt.avatar}
            label={`${handle} avatar`}
            size="sm"
          />
        </Link>
        <Link
          href={getReceiptHref(handle, Boolean(currentUser))}
          onClick={(event) => event.stopPropagation()}
          className="truncate text-xs font-black text-white transition hover:text-lime-200"
        >
          {handle} <span className="text-sky-300">◆</span>
        </Link>
      </div>

      <h3 className="mt-3 min-h-14 text-xl font-black leading-tight text-white">{receipt.take}</h3>
      <p className="text-xs font-black uppercase text-lime-300">{receipt.arena}</p>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-3 text-center">
        <ScoreMini team={receipt.leftTeam} score={receipt.leftScore} />
        <span className="pb-2 text-xl text-gray-300">ϟ</span>
        <ScoreMini team={receipt.rightTeam} score={receipt.rightScore} />
      </div>

      <div className={`mt-4 grid grid-cols-2 gap-2 rounded-xl border p-2 text-xs font-black uppercase ${isWin ? "border-lime-300/20 bg-lime-400/10" : "border-red-300/20 bg-red-500/10"}`}>
        <span className={receipt.side === "riding" ? "text-lime-300" : "text-purple-300"}>{receipt.crowdResult}</span>
        <span className={`text-right ${isWin ? "text-lime-300" : "text-red-300"}`}>{receipt.verdict}</span>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs font-black text-gray-400">
        <span>🔥 {receipt.heat}</span>
        <span>◉ {receipt.views}</span>
      </div>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setShowShare((current) => !current);
        }}
        className="mt-3 min-h-10 w-full rounded-xl border border-purple-300/40 bg-purple-500/10 px-3 text-[11px] font-black uppercase tracking-[0.1em] text-purple-100 transition hover:bg-purple-500/20"
      >
        Share Receipt
      </button>
      {showShare ? (
        <div className="mt-2 rounded-xl border border-white/10 bg-black/50 p-2">
          <ShareActions
            type="receipt"
            title="Share Receipt"
            text="Called it. Receipt checked on Lockt."
            caption={`Called it. ${receipt.take} Receipt checked on Lockt.`}
            url={buildSiteUrl(`/receipt/${encodeURIComponent(receipt.id)}`)}
          />
        </div>
      ) : null}
      <button
        type="button"
        disabled
        className="mt-2 min-h-9 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-[10px] font-black uppercase tracking-[0.1em] text-gray-500"
      >
        Share in Lockt (Soon)
      </button>
    </article>
  );
}

function ScoreMini({ team, score }: { team: string; score: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase text-gray-400">{team}</p>
      <p className="scoreboard-number mt-1 text-3xl text-white">{score}</p>
    </div>
  );
}

function ViralReceiptCard({
  receipt,
  currentUser,
  onOpen,
}: {
  receipt: ViralReceipt;
  currentUser?: ReceiptOwnerMeta;
  onOpen: (receiptId: string) => void;
}) {
  const [showShare, setShowShare] = useState(false);
  const isWin = receipt.status === "win";
  const handle = currentUser?.handle ?? receipt.handle;
  const handleOpenKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(receipt.id);
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(receipt.id)}
      onKeyDown={handleOpenKeyDown}
      className={`relative min-w-[72vw] max-w-[15rem] snap-start overflow-hidden rounded-2xl border bg-black/45 p-3 shadow-[0_18px_45px_rgba(0,0,0,0.34)] transition hover:-translate-y-1 active:scale-[0.985] sm:min-w-[13.75rem] ${
        isWin
          ? "border-lime-300/35 hover:shadow-[0_20px_52px_rgba(132,204,22,0.12)]"
          : "border-red-300/35 hover:shadow-[0_20px_52px_rgba(248,113,113,0.1)]"
      }`}
    >
      <div className="absolute -right-8 -top-8 h-28 w-28 rotate-45 bg-gradient-to-br from-purple-500/50 to-lime-400/20" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <span
            className={`rounded-md px-2 py-1 text-[10px] font-black uppercase ${
              isWin ? "bg-lime-400/15 text-lime-300" : "bg-red-500/15 text-red-300"
            }`}
          >
            {receipt.hitRate} hit
          </span>
          <span className="sports-display text-2xl italic leading-none text-white">#{receipt.rank}</span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Link
            href={getReceiptHref(handle, Boolean(currentUser))}
            onClick={(event) => event.stopPropagation()}
            className="rounded-full transition hover:scale-105 active:scale-95"
            aria-label={`${handle} receipts`}
          >
            <UserAvatar
              avatarUrl={currentUser?.avatarUrl}
              initials={currentUser?.initials ?? receipt.avatar}
              label={`${handle} avatar`}
              size="sm"
            />
          </Link>
          <Link
            href={getReceiptHref(handle, Boolean(currentUser))}
            onClick={(event) => event.stopPropagation()}
            className="truncate text-xs font-black text-white transition hover:text-lime-200"
          >
            {handle} <span className="text-sky-300">◆</span>
          </Link>
        </div>

        <h3 className="mt-3 min-h-16 text-xl font-black leading-tight text-white">{receipt.take}</h3>
        <p className="text-xs font-black uppercase text-lime-300">{receipt.arena}</p>

        <p className="scoreboard-number mt-5 text-5xl text-gray-200">
          ◉ {receipt.views}
          <span className="ml-1 text-xs font-black uppercase tracking-normal text-gray-500">Views</span>
        </p>

        <div className="mt-4 flex justify-between text-xs font-black text-gray-400">
          <span>🔥 {receipt.heat}</span>
          <span>▰ {receipt.comments}</span>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setShowShare((current) => !current);
          }}
          className="mt-3 min-h-10 w-full rounded-xl border border-purple-300/40 bg-purple-500/10 px-3 text-[11px] font-black uppercase tracking-[0.1em] text-purple-100 transition hover:bg-purple-500/20"
        >
          Share Receipt
        </button>
        {showShare ? (
          <div className="mt-2 rounded-xl border border-white/10 bg-black/50 p-2">
            <ShareActions
              type="receipt"
              title="Share Receipt"
              text="Called it. Receipt checked on Lockt."
              caption={`Called it. ${receipt.take} Receipt checked on Lockt.`}
              url={buildSiteUrl(`/receipt/${encodeURIComponent(receipt.id)}`)}
            />
          </div>
        ) : null}
        <button
          type="button"
          disabled
          className="mt-2 min-h-9 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-[10px] font-black uppercase tracking-[0.1em] text-gray-500"
        >
          Share in Lockt (Soon)
        </button>
      </div>
    </article>
  );
}

function PerformanceBadgeCard({ badge, compact = false }: { badge: PerformanceBadge; compact?: boolean }) {
  const toneClass = {
    green: "border-lime-300/30 text-lime-300 shadow-[0_0_24px_rgba(132,204,22,0.12)]",
    purple: "border-purple-300/30 text-purple-300 shadow-[0_0_24px_rgba(168,85,247,0.12)]",
    blue: "border-blue-300/30 text-blue-300 shadow-[0_0_24px_rgba(96,165,250,0.1)]",
    red: "border-red-300/30 text-red-300 shadow-[0_0_24px_rgba(248,113,113,0.1)]",
    teal: "border-teal-300/30 text-teal-300 shadow-[0_0_24px_rgba(45,212,191,0.1)]",
  }[badge.tone];
  const stateClass = badge.earned
    ? toneClass
    : "border-white/10 text-gray-600 shadow-none opacity-70 grayscale";

  return (
    <article className={`group min-w-[8.25rem] snap-start rounded-2xl border bg-black/35 text-center transition duration-200 hover:-translate-y-1 hover:bg-white/[0.035] hover:shadow-[0_0_30px_currentColor] active:scale-[0.985] lg:min-w-0 ${compact ? "p-2.5" : "p-3"} ${stateClass}`}>
      <div className={`mx-auto grid place-items-center rounded-2xl border border-current bg-current/10 transition group-hover:scale-105 ${compact ? "h-10 w-10 text-lg" : "h-12 w-12 text-xl"}`}>
        {badge.earned ? badge.icon : "□"}
      </div>
      <p className="mt-3 text-[10px] font-black uppercase">{badge.name}</p>
      <p className="mt-1 text-[10px] font-semibold text-gray-500">{badge.earned ? badge.subtitle : `Locked · ${badge.subtitle}`}</p>
    </article>
  );
}

function getReceiptOwner(profile?: Profile | null, recordOwner?: ReceiptOwner | null): ReceiptOwnerMeta {
  const username = recordOwner?.username || profile?.username || "TalkHeavy23";
  const isViewingRecordOwner = Boolean(recordOwner);

  return {
    userId: isViewingRecordOwner ? recordOwner?.userId : profile?.id,
    handle: `@${username.replace(/^@/, "")}`,
    initials: getInitials(username),
    avatarUrl: isViewingRecordOwner ? (recordOwner?.avatarUrl ?? null) : profile?.avatar_url,
    reputation: isViewingRecordOwner ? recordOwner?.reputation : profile?.reputation_score ?? profile?.reputation,
    isCurrentUser: !isViewingRecordOwner,
    accountVisibility: isViewingRecordOwner ? recordOwner?.accountVisibility ?? "public" : profile?.account_visibility ?? "public",
    followersCount: isViewingRecordOwner ? recordOwner?.followersCount ?? 0 : profile?.followers_count ?? 0,
    followingCount: isViewingRecordOwner ? recordOwner?.followingCount ?? 0 : profile?.following_count ?? 0,
    currentFollowStatus: isViewingRecordOwner ? recordOwner?.currentFollowStatus ?? null : null,
    canViewReceipts: isViewingRecordOwner ? recordOwner?.canViewReceipts ?? true : true,
  };
}

function getReceiptHref(handle: string, isCurrentUser = false) {
  if (isCurrentUser) {
    return "/receipts";
  }

  return `/receipts/${handle.replace(/^@/, "").toLowerCase()}`;
}

function getInitials(username: string) {
  const cleanUsername = username.replace(/^@/, "").trim();
  const capitalLetters = cleanUsername.match(/[A-Z]/g);

  if (capitalLetters && capitalLetters.length > 1) {
    return capitalLetters.slice(0, 2).join("");
  }

  return cleanUsername.slice(0, 2).toUpperCase() || "ST";
}

function mapReceiptToRecent(receipt: Receipt, owner: ReceiptOwnerMeta): RecentReceipt {
  const score = parseFinalScore(receipt.final_score);
  const rideTotal = receipt.ride_count + receipt.fade_count;
  const ridingWon = receipt.ride_count >= receipt.fade_count;
  const crowdPercent = rideTotal ? Math.round(((ridingWon ? receipt.ride_count : receipt.fade_count) / rideTotal) * 100) : 0;

  return {
    id: receipt.id,
    status: receipt.result === "hit" ? "win" : "loss",
    timestamp: formatReceiptAge(receipt.created_at),
    handle: owner.handle,
    avatar: owner.initials,
    take: receipt.take_text,
    arena: receipt.game_label ?? receipt.game_id.replaceAll("-", " ").toUpperCase(),
    leftTeam: score?.leftTeam ?? "USA",
    leftScore: score?.leftScore ?? "2",
    rightTeam: score?.rightTeam ?? "PAR",
    rightScore: score?.rightScore ?? "1",
    crowdResult: `${crowdPercent || 50}% ${ridingWon ? "Riding" : "Fading"}`,
    side: ridingWon ? "riding" : "fading",
    verdict: `${formatSignedRep(receipt.reputation_delta)} REP`,
    heat: formatCompact(receipt.heat),
    views: `${formatCompact(receipt.reply_count)} replies`,
  };
}

function mapSeededReceiptToRecent(receipt: SeededReceipt, owner: ReceiptOwnerMeta): RecentReceipt {
  const score = parseSeededFinalScore(receipt.finalScore);
  const rideTotal = receipt.ride_count + receipt.fade_count;
  const ridingWon = receipt.ride_count >= receipt.fade_count;
  const crowdPercent = rideTotal ? Math.round(((ridingWon ? receipt.ride_count : receipt.fade_count) / rideTotal) * 100) : 0;

  return {
    id: receipt.id,
    status: receipt.result === "hit" ? "win" : "loss",
    timestamp: formatReceiptAge(receipt.created_at),
    handle: owner.handle,
    avatar: owner.initials,
    take: receipt.takeText,
    arena: receipt.gameLabel,
    leftTeam: score?.leftTeam ?? "USA",
    leftScore: score?.leftScore ?? "2",
    rightTeam: score?.rightTeam ?? "PAR",
    rightScore: score?.rightScore ?? "1",
    crowdResult: `${crowdPercent || 50}% ${ridingWon ? "Riding" : "Fading"}`,
    side: ridingWon ? "riding" : "fading",
    verdict: `${formatSignedRep(receipt.reputation_delta)} REP`,
    heat: formatCompact(receipt.heat),
    views: `${formatCompact(receipt.reply_count)} replies`,
  };
}

function mapSeededReceiptToViral(receipt: SeededReceipt, owner: ReceiptOwnerMeta, index: number): ViralReceipt {
  const total = receipt.ride_count + receipt.fade_count;
  const hitRate = total ? `${Math.round((receipt.ride_count / total) * 100)}%` : "0%";

  return {
    id: receipt.id,
    rank: index + 1,
    hitRate,
    handle: owner.handle,
    avatar: owner.initials,
    take: receipt.takeText,
    arena: receipt.gameLabel,
    views: index === 0 ? "2.4M" : index === 1 ? "1.8M" : "842K",
    heat: formatCompact(receipt.heat),
    comments: formatCompact(receipt.reply_count),
    status: receipt.result === "hit" ? "win" : "loss",
  };
}

function parseFinalScore(finalScore?: string | null) {
  const match = finalScore?.match(/^(\S+)\s+(\d+)\s+-\s+(\d+)\s+(\S+)$/);

  if (!match) {
    return null;
  }

  return {
    leftTeam: match[1],
    leftScore: match[2],
    rightScore: match[3],
    rightTeam: match[4],
  };
}

function parseSeededFinalScore(finalScore: string) {
  const match = finalScore.match(/^(\S+)\s+(\d+)\s+\/\s+(\S+)\s+(\d+)$/);

  if (!match) {
    return null;
  }

  return {
    leftTeam: match[1],
    leftScore: match[2],
    rightTeam: match[3],
    rightScore: match[4],
  };
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

function formatSignedRep(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

function formatReceiptAge(createdAt: string) {
  const createdTime = new Date(createdAt).getTime();
  const minutes = Math.max(0, Math.floor((Date.now() - createdTime) / 60000));

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.floor(hours / 24)}d ago`;
}
