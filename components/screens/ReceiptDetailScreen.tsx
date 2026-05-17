"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { RouteBottomNav } from "@/components/BottomNav";
import { LocktLogo } from "@/components/LocktLogo";
import { UserAvatar } from "@/components/UserAvatar";
import { getSeededProfileById, getSeededReceiptById } from "@/data/seededCrowd";
import { getCrowdPressure, getHeatStatus, getReputationLevel } from "@/lib/reputation";
import { buildSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/client";
import { getReceiptById } from "@/lib/supabase/receipts";
import { getRepliesForTake, type TakeReplyWithAuthor } from "@/lib/supabase/replies";
import type { Profile, ProfileCard, Receipt } from "@/lib/supabase/types";
import { ReportModal } from "@/components/moderation/ReportModal";
import { muteUser, blockUser } from "@/lib/supabase/moderation";
import { shareWithFallback, type ShareOutcome } from "@/lib/share";

type ReceiptView = {
  id: string;
  takeId: string | null;
  userId: string;
  result: "hit" | "miss";
  takeText: string;
  gameLabel: string;
  finalScore: string;
  rideCount: number;
  fadeCount: number;
  replyCount: number;
  heat: number;
  reputationDelta: number;
  createdAt: string;
};

export function ReceiptDetailScreen({ receiptId, profile }: { receiptId: string; profile?: Profile | null }) {
  const router = useRouter();
  const [receipt, setReceipt] = useState<ReceiptView | null>(null);
  const [author, setAuthor] = useState<ProfileCard | null>(null);
  const [replies, setReplies] = useState<TakeReplyWithAuthor[]>([]);
  const [message, setMessage] = useState("");
  const [shareState, setShareState] = useState<"idle" | ShareOutcome>("idle");
  const [reportUserOpen, setReportUserOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadReceipt() {
      setLoading(true);

      const seededReceipt = getSeededReceiptById(receiptId);

      if (seededReceipt) {
        const seededProfile = getSeededProfileById(seededReceipt.userId);

        if (!isMounted) {
          return;
        }

        setReceipt({
          id: seededReceipt.id,
          takeId: null,
          userId: seededReceipt.userId,
          result: seededReceipt.result,
          takeText: seededReceipt.takeText,
          gameLabel: seededReceipt.gameLabel,
          finalScore: seededReceipt.finalScore,
          rideCount: seededReceipt.ride_count,
          fadeCount: seededReceipt.fade_count,
          replyCount: seededReceipt.reply_count,
          heat: seededReceipt.heat,
          reputationDelta: seededReceipt.reputation_delta,
          createdAt: seededReceipt.created_at,
        });
        setAuthor(
          seededProfile
            ? {
                id: seededProfile.id,
                username: seededProfile.username,
                avatar_url: null,
                reputation_score: seededProfile.reputation_score,
                created_takes_count: seededProfile.created_takes_count,
              }
            : null,
        );
        setReplies([]);
        setLoading(false);
        return;
      }

      const { receipt: realReceipt, error } = await getReceiptById(receiptId);

      if (!isMounted) {
        return;
      }

      if (error || !realReceipt) {
        setMessage(error?.message || "Receipt not found.");
        setLoading(false);
        return;
      }

      setReceipt(mapReceipt(realReceipt));

      const supabase = createClient();

      if (supabase) {
        const { data: profileCard } = await supabase
          .from("profile_cards")
          .select("*")
          .eq("id", realReceipt.user_id)
          .maybeSingle();

        if (isMounted) {
          setAuthor(profileCard ?? null);
        }
      }

      const { replies: loadedReplies } = await getRepliesForTake(realReceipt.take_id);

      if (isMounted) {
        setReplies(loadedReplies);
        setLoading(false);
      }
    }

    loadReceipt();

    return () => {
      isMounted = false;
    };
  }, [receiptId]);

  async function shareReceipt() {
    const url = buildSiteUrl(`/receipt/${encodeURIComponent(receiptId)}`);

    try {
      const outcome = await shareWithFallback({
        title: "LOCKT Receipt",
        text: "Proof's on the board.",
        url,
      });
      if (outcome === "cancelled") {
        return;
      }
      setShareState(outcome);
      window.setTimeout(() => setShareState("idle"), 1800);
    } catch {
      setMessage("Could not share this receipt link.");
    }
  }

  async function muteReceiptUser() {
    if (!receipt) return;
    const { error } = await muteUser(receipt.userId);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("User muted. Their content is hidden from your feed.");
  }

  async function blockReceiptUser() {
    if (!receipt) return;
    const { error } = await blockUser(receipt.userId);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("User blocked. Their content is now hidden.");
  }

  function goBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(getAuthorReceiptHref(author, profile, receipt));
  }

  const username = author?.username || profile?.username || "Talker";
  const authorHref = getAuthorReceiptHref(author, profile, receipt);
  const score = parseReceiptScore(receipt?.finalScore);
  const isWin = receipt?.result !== "miss";
  const level = getReputationLevel(author?.reputation_score ?? 0, author?.created_takes_count ?? 0);
  const heatStatus = getHeatStatus({ heat: receipt?.heat ?? 0, reputation: author?.reputation_score ?? 0, result: receipt?.result });
  const pressure = getCrowdPressure({
    rideCount: receipt?.rideCount ?? 0,
    fadeCount: receipt?.fadeCount ?? 0,
    heat: receipt?.heat ?? 0,
    replyCount: Math.max(receipt?.replyCount ?? 0, replies.length),
  });

  return (
    <>
      <main className="min-h-dvh overflow-x-hidden bg-transparent py-5 text-white sm:py-6">
        <div className="feed-shell screen-safe-bottom space-y-5">
          <header className="rounded-[1.75rem] border border-white/10 bg-black/35 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.36)] backdrop-blur">
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
              <button
                type="button"
                onClick={goBack}
                className="grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-white/[0.04] text-2xl text-white transition hover:border-lime-300/30 active:scale-95"
                aria-label="Go back"
              >
                ‹
              </button>
              <div className="flex min-w-0 items-center gap-3">
                <LocktLogo size={54} />
                <div className="min-w-0">
                  <h1 className="brand-lockup text-[1.8rem] leading-[0.82]">
                    <span className="block text-white">Receipt</span>
                    <span className="block bg-gradient-to-r from-lime-300 via-white to-purple-400 bg-clip-text text-transparent">
                      Detail
                    </span>
                  </h1>
                </div>
              </div>
              <button
                type="button"
                onClick={shareReceipt}
                className="min-h-12 rounded-2xl border border-purple-300/45 bg-purple-500/15 px-4 text-xs font-black uppercase tracking-[0.1em] text-purple-100 transition hover:-translate-y-0.5 active:scale-95"
              >
                {shareState === "shared" ? "SHARED" : shareState === "copied" ? "LINK COPIED" : "SHARE"}
              </button>
              <button
                type="button"
                onClick={() => setReportUserOpen(true)}
                className="ml-2 min-h-12 rounded-2xl border border-yellow-300/45 bg-yellow-500/15 px-3 text-xs font-black uppercase tracking-[0.1em] text-yellow-100 transition hover:-translate-y-0.5 active:scale-95"
              >
                FLAG
              </button>
              <button
                type="button"
                onClick={muteReceiptUser}
                className="ml-2 min-h-12 rounded-2xl border border-white/35 bg-white/10 px-3 text-xs font-black uppercase tracking-[0.1em] text-gray-100"
              >
                MUTE
              </button>
              <button
                type="button"
                onClick={blockReceiptUser}
                className="ml-2 min-h-12 rounded-2xl border border-red-300/45 bg-red-500/15 px-3 text-xs font-black uppercase tracking-[0.1em] text-red-100"
              >
                BLOCK
              </button>
            </div>
          </header>

          {loading ? (
            <section className="rounded-[1.75rem] border border-white/10 bg-black/35 p-6 text-center">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-gray-400">Loading receipt...</p>
            </section>
          ) : receipt ? (
            <>
              <article
                className={`relative isolate overflow-hidden rounded-[2rem] border p-4 shadow-[0_30px_90px_rgba(0,0,0,0.56)] sm:p-5 ${
                  isWin ? "border-lime-300/30 bg-[#051006]/92" : "border-red-300/30 bg-[#120607]/92"
                }`}
              >
                <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_16%_12%,rgba(132,204,22,0.18),transparent_32%),radial-gradient(circle_at_84%_18%,rgba(168,85,247,0.2),transparent_34%)]" />
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <Link href={authorHref} className="flex min-w-0 items-center gap-3 transition hover:text-lime-200">
                    <UserAvatar
                      avatarUrl={author?.avatar_url}
                      initials={getInitials(username)}
                      label={`${username} receipts`}
                      size="lg"
                      active
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lime-300">
                        Receipts don&apos;t lie
                      </p>
                      <h2 className="mt-1 truncate text-3xl font-black italic text-white">@{username}</h2>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded-md border border-lime-300/25 bg-lime-400/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-lime-300">
                          {level.title}
                        </span>
                        <span className="rounded-md border border-purple-300/25 bg-purple-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-purple-200">
                          {heatStatus.label}
                        </span>
                        <span className="rounded-md border border-white/10 bg-black/35 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-gray-300">
                          {formatAge(receipt.createdAt)}
                        </span>
                      </div>
                    </div>
                  </Link>
                  <span
                    className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.14em] ${
                      isWin ? "bg-lime-400/15 text-lime-300" : "bg-red-500/15 text-red-300"
                    }`}
                  >
                    {isWin ? "Win" : "Loss"}
                  </span>
                </div>

                <h3 className="mt-6 text-4xl font-black italic leading-[0.96] text-white sm:text-6xl">
                  {receipt.takeText}
                </h3>
                <p className="mt-3 text-sm font-black uppercase tracking-[0.14em] text-sky-300">{receipt.gameLabel}</p>
                <p className={`mt-3 inline-flex rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] ${
                  pressure.tone === "green"
                    ? "border-lime-300/25 bg-lime-400/10 text-lime-200"
                    : "border-purple-300/25 bg-purple-500/10 text-purple-200"
                }`}>
                  {pressure.label} · {pressure.detail}
                </p>

                <div className="mt-6 grid max-w-xl grid-cols-[1fr_auto_1fr] items-end gap-3 text-center">
                  <ScoreMini team={score?.leftTeam ?? "LAL"} score={score?.leftScore ?? "108"} />
                  <span className="pb-2 text-3xl text-purple-200">ϟ</span>
                  <ScoreMini team={score?.rightTeam ?? "GSW"} score={score?.rightScore ?? "103"} />
                </div>

                <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  <ReceiptStat label="Heat" value={`🔥 ${formatCompact(receipt.heat)}`} tone="lime" />
                  <ReceiptStat label="Ride" value={formatCompact(receipt.rideCount)} tone="lime" />
                  <ReceiptStat label="Fade" value={formatCompact(receipt.fadeCount)} tone="purple" />
                  <ReceiptStat label="Replies" value={formatCompact(Math.max(receipt.replyCount, replies.length))} tone="white" />
                  <ReceiptStat label="REP" value={formatSigned(receipt.reputationDelta)} tone={isWin ? "lime" : "red"} />
                </div>
              </article>

              <section className="rounded-[1.75rem] border border-white/10 bg-black/30 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.34)] backdrop-blur">
                <div className="mb-3 flex items-center justify-between gap-3 px-1">
                  <h2 className="sports-display text-2xl italic leading-none text-white">
                    <span className="mr-2 not-italic">▣</span>
                    Receipt Replies
                  </h2>
                  <span className="text-xs font-black uppercase text-purple-300">{replies.length} live</span>
                </div>

                {replies.length ? (
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/35">
                    {replies.slice(0, 8).map((reply) => {
                      const replyUsername = reply.author?.username ?? "Talker";

                      return (
                        <article key={reply.id} className="grid grid-cols-[auto_1fr] gap-3 border-b border-white/10 p-3 last:border-b-0">
                          <Link href={getReceiptHref(replyUsername)} className="rounded-full transition hover:scale-105 active:scale-95">
                            <UserAvatar avatarUrl={reply.author?.avatar_url} initials={getInitials(replyUsername)} size="sm" />
                          </Link>
                          <div className="min-w-0">
                            <Link href={getReceiptHref(replyUsername)} className="text-sm font-black text-white transition hover:text-lime-200">
                              @{replyUsername.replace(/^@/, "")}
                            </Link>
                            <p className="mt-1 text-sm font-semibold leading-relaxed text-gray-300">{reply.reply_text}</p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-black/35 p-5 text-center">
                    <p className="text-sm font-black uppercase tracking-[0.12em] text-gray-400">
                      No replies tied to this receipt yet.
                    </p>
                    <p className="mt-1 text-xs font-semibold text-gray-500">The proof still stands.</p>
                  </div>
                )}
              </section>
            </>
          ) : (
            <section className="rounded-[1.75rem] border border-red-400/25 bg-red-500/10 p-6 text-center">
              <h2 className="sports-display text-3xl italic text-white">Receipt not found.</h2>
              <p className="mt-2 text-sm font-semibold text-gray-300">{message || "This proof card may not exist yet."}</p>
            </section>
          )}

          {message && receipt && (
            <p className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-red-200">
              {message}
            </p>
          )}
        </div>
      <ReportModal
        open={reportUserOpen && Boolean(receipt)}
        onClose={() => setReportUserOpen(false)}
        targetType="user"
        targetId={receipt?.userId ?? ""}
      />
      </main>
      <RouteBottomNav activeView="receipts" />
    </>
  );
}

function mapReceipt(receipt: Receipt): ReceiptView {
  return {
    id: receipt.id,
    takeId: receipt.take_id,
    userId: receipt.user_id,
    result: receipt.result,
    takeText: receipt.take_text,
    gameLabel: receipt.game_label ?? receipt.game_id.replaceAll("-", " ").toUpperCase(),
    finalScore: receipt.final_score ?? "LAL 108 / GSW 103",
    rideCount: receipt.ride_count,
    fadeCount: receipt.fade_count,
    replyCount: receipt.reply_count,
    heat: receipt.heat,
    reputationDelta: receipt.reputation_delta,
    createdAt: receipt.created_at,
  };
}

function ScoreMini({ team, score }: { team: string; score: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase text-gray-400">{team}</p>
      <p className="scoreboard-number mt-1 text-4xl text-white sm:text-5xl">{score}</p>
    </div>
  );
}

function ReceiptStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "lime" | "purple" | "white" | "red";
}) {
  const toneClass =
    tone === "lime" ? "text-lime-300" : tone === "purple" ? "text-purple-300" : tone === "red" ? "text-red-300" : "text-white";

  return (
    <div className="rounded-2xl border border-white/10 bg-black/45 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">{label}</p>
      <p className={`mt-2 text-lg font-black ${toneClass}`}>{value}</p>
    </div>
  );
}

function getAuthorReceiptHref(author: ProfileCard | null, profile: Profile | null | undefined, receipt: ReceiptView | null) {
  if (author?.id && profile?.id === author.id) {
    return "/receipts";
  }

  if (author?.username) {
    return getReceiptHref(author.username);
  }

  if (receipt?.userId?.startsWith("seeded_user_")) {
    const seededProfile = getSeededProfileById(receipt.userId);
    return seededProfile ? getReceiptHref(seededProfile.username) : "/receipts";
  }

  return "/receipts";
}

function getReceiptHref(username: string) {
  return `/receipts/${username.replace(/^@/, "").toLowerCase()}`;
}

function parseReceiptScore(finalScore?: string | null) {
  const slashMatch = finalScore?.match(/^(\S+)\s+(\d+)\s+\/\s+(\S+)\s+(\d+)$/);

  if (slashMatch) {
    return {
      leftTeam: slashMatch[1],
      leftScore: slashMatch[2],
      rightTeam: slashMatch[3],
      rightScore: slashMatch[4],
    };
  }

  const dashMatch = finalScore?.match(/^(\S+)\s+(\d+)\s+-\s+(\d+)\s+(\S+)$/);

  if (!dashMatch) {
    return null;
  }

  return {
    leftTeam: dashMatch[1],
    leftScore: dashMatch[2],
    rightScore: dashMatch[3],
    rightTeam: dashMatch[4],
  };
}

function getInitials(username: string) {
  const cleanUsername = username.replace(/^@/, "").trim();
  const capitalLetters = cleanUsername.match(/[A-Z]/g);

  if (capitalLetters && capitalLetters.length > 1) {
    return capitalLetters.slice(0, 2).join("");
  }

  return cleanUsername.slice(0, 2).toUpperCase() || "ST";
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

function formatSigned(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

function formatAge(createdAt: string) {
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
