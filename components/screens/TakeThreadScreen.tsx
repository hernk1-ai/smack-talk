"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SmackTalkLogo } from "@/components/SmackTalkLogo";
import { UserAvatar } from "@/components/UserAvatar";
import {
  formatTakeForUI,
  getTakeById,
  profileToCard,
  type ArenaTake,
} from "@/lib/supabase/arena";
import { createReply, getRepliesForTake, type TakeReplyWithAuthor } from "@/lib/supabase/replies";
import { getMyReactionForTake, reactToTake } from "@/lib/supabase/reactions";
import type { Profile, TakeReaction } from "@/lib/supabase/types";

type Side = "ride" | "fade";

export function TakeThreadScreen({ takeId, profile }: { takeId: string; profile?: Profile | null }) {
  const router = useRouter();
  const [take, setTake] = useState<ArenaTake | null>(null);
  const [replies, setReplies] = useState<TakeReplyWithAuthor[]>([]);
  const [reaction, setReaction] = useState<TakeReaction["reaction"] | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [reactionLoading, setReactionLoading] = useState(false);
  const [replyStatus, setReplyStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadThread() {
      setLoading(true);
      const [{ take: loadedTake, error: takeError }, { replies: loadedReplies }, { reaction: loadedReaction }] =
        await Promise.all([getTakeById(takeId), getRepliesForTake(takeId), getMyReactionForTake(takeId)]);

      if (!isMounted) {
        return;
      }

      if (takeError) {
        setMessage(takeError.message);
      }

      setTake(loadedTake);
      setReplies(loadedReplies);
      setReaction(loadedReaction?.reaction ?? null);
      setLoading(false);
    }

    loadThread();

    return () => {
      isMounted = false;
    };
  }, [takeId]);

  async function chooseReaction(side: Side) {
    setReactionLoading(true);
    setMessage("");

    const { reaction: savedReaction, take: updatedTake, error } = await reactToTake({ takeId, reaction: side });

    if (error) {
      setMessage(error.message);
      setReactionLoading(false);
      return;
    }

    if (savedReaction) {
      setReaction(savedReaction.reaction);
    }

    if (updatedTake) {
      setTake((currentTake) => ({
        ...updatedTake,
        author: currentTake?.author ?? null,
      }));
    }

    setReactionLoading(false);
  }

  async function postReply() {
    setReplyStatus("loading");
    setMessage("");

    const { reply, error } = await createReply({ takeId, replyText });

    if (error) {
      setReplyStatus("error");
      setMessage(error.message);
      return;
    }

    if (reply) {
      setReplies((currentReplies) => [
        ...currentReplies,
        {
          ...reply,
          author: profileToCard(profile),
        },
      ]);
    }

    const { take: updatedTake } = await getTakeById(takeId);

    if (updatedTake) {
      setTake(updatedTake);
    }

    setReplyText("");
    setReplyStatus("success");
    setMessage("Reply posted. Everyone can see it.");
  }

  const author = take ? formatTakeForUI(take) : null;
  const canPostReply = replyStatus !== "loading" && replyText.trim().length > 0;

  return (
    <main className="min-h-dvh overflow-x-hidden bg-transparent py-5 text-white sm:py-6">
      <div className="feed-shell screen-safe-bottom space-y-5">
        <header className="rounded-[1.75rem] border border-white/10 bg-black/35 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.36)] backdrop-blur">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-white/[0.04] text-2xl text-white transition hover:border-lime-300/30 active:scale-95"
              aria-label="Go back"
            >
              ‹
            </button>
            <div className="flex min-w-0 items-center gap-3">
              <SmackTalkLogo size={54} />
              <div className="min-w-0">
                <h1 className="brand-lockup text-[1.8rem] leading-[0.82]">
                  <span className="block text-white">Take</span>
                  <span className="block bg-gradient-to-r from-lime-300 via-white to-purple-400 bg-clip-text text-transparent">
                    Thread
                  </span>
                </h1>
              </div>
            </div>
            <span className="rounded-full border border-lime-300/30 bg-lime-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-lime-300">
              Public
            </span>
          </div>
        </header>

        {loading ? (
          <section className="rounded-[1.75rem] border border-white/10 bg-black/35 p-6 text-center">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-gray-400">Loading take...</p>
          </section>
        ) : take ? (
          <>
            <section className="rounded-[1.75rem] border border-lime-300/25 bg-black/45 p-4 shadow-[0_26px_80px_rgba(0,0,0,0.52),0_0_34px_rgba(132,204,22,0.08)]">
              <div className="flex items-start gap-3">
                <UserAvatar avatarUrl={author?.avatarUrl} initials={author?.initials ?? "ST"} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-black text-white">{author?.handle ?? "@LockedTalker"}</p>
                    <span className="text-sky-300">◆</span>
                    <span className="text-xs font-bold text-gray-500">{formatTakeAge(take.created_at)}</span>
                  </div>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-purple-300">
                    {take.game_id.replaceAll("-", " ")}
                  </p>
                </div>
                <span className="rounded-full border border-purple-300/30 bg-purple-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-purple-200">
                  {take.status}
                </span>
              </div>

              <h2 className="mt-5 text-4xl font-black italic leading-[0.95] text-white sm:text-5xl">{take.take_text}</h2>

              <div className="mt-5 grid grid-cols-4 gap-2 rounded-2xl border border-white/10 bg-black/45 p-3 text-center">
                <ThreadStat label="Heat" value={`🔥 ${formatCompact(take.heat)}`} tone="lime" />
                <ThreadStat label="Riding" value={formatCompact(take.ride_count)} tone="lime" />
                <ThreadStat label="Fading" value={formatCompact(take.fade_count)} tone="purple" />
                <ThreadStat label="Replies" value={formatCompact(take.reply_count)} tone="white" />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <ThreadReactionButton
                  active={reaction === "ride"}
                  disabled={reactionLoading}
                  side="ride"
                  onClick={() => chooseReaction("ride")}
                />
                <ThreadReactionButton
                  active={reaction === "fade"}
                  disabled={reactionLoading}
                  side="fade"
                  onClick={() => chooseReaction("fade")}
                />
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-purple-300/30 bg-purple-500/10 p-4 shadow-[0_0_34px_rgba(168,85,247,0.14)]">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-300">Talk back</p>
                  <h2 className="sports-display mt-1 text-2xl italic leading-none text-white">Public replies</h2>
                </div>
                <span className="rounded-full border border-lime-300/25 bg-lime-400/10 px-3 py-1 text-[10px] font-black uppercase text-lime-300">
                  {take.reply_count} replies
                </span>
              </div>

              <label className="sr-only" htmlFor="thread-reply">
                Reply to this take
              </label>
              <div className="relative">
                <textarea
                  id="thread-reply"
                  value={replyText}
                  maxLength={280}
                  onChange={(event) => {
                    setReplyText(event.target.value);
                    if (replyStatus !== "loading") {
                      setReplyStatus("idle");
                      setMessage("");
                    }
                  }}
                  placeholder="Talk back..."
                  className="min-h-24 w-full resize-none rounded-2xl border border-purple-300/45 bg-black/55 px-4 py-4 pr-16 text-base font-semibold text-white outline-none transition placeholder:text-gray-600 focus:border-lime-300/60 focus:shadow-[0_0_24px_rgba(132,204,22,0.12)]"
                />
                <span className="absolute bottom-3 right-4 text-xs font-bold text-gray-500">{replyText.length}/280</span>
              </div>
              <button
                type="button"
                onClick={postReply}
                disabled={!canPostReply}
                className="mt-3 min-h-12 w-full rounded-2xl border border-purple-300/60 bg-purple-500/15 px-6 text-sm font-black uppercase tracking-[0.12em] text-purple-100 shadow-[0_0_24px_rgba(168,85,247,0.14)] transition hover:-translate-y-0.5 hover:bg-purple-500/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {replyStatus === "loading" ? "Posting..." : "Post Reply"}
              </button>
              <p className="mt-3 text-xs font-semibold text-gray-400">Replies are public. Attack takes, not lives.</p>
            </section>

            {message && (
              <p
                className={`rounded-2xl border px-3 py-2 text-xs font-black uppercase tracking-[0.1em] ${
                  replyStatus === "error"
                    ? "border-red-400/35 bg-red-500/10 text-red-200"
                    : "border-lime-300/30 bg-lime-400/10 text-lime-300"
                }`}
              >
                {message}
              </p>
            )}

            <section className="rounded-[1.75rem] border border-white/10 bg-black/30 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.34)] backdrop-blur">
              <div className="mb-3 flex items-center justify-between gap-3 px-1">
                <h2 className="sports-display text-2xl italic leading-none text-white">
                  <span className="mr-2 not-italic">▣</span>
                  Replies
                </h2>
                <span className="text-xs font-black uppercase text-purple-300">{replies.length} live</span>
              </div>

              {replies.length ? (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/35">
                  {replies.map((reply) => {
                    const username = reply.author?.username ?? "Talker";
                    const handle = username.startsWith("@") ? username : `@${username}`;

                    return (
                      <article key={reply.id} className="grid grid-cols-[auto_1fr] gap-3 border-b border-white/10 p-3 last:border-b-0">
                        <UserAvatar
                          avatarUrl={reply.author?.avatar_url}
                          initials={getInitials(username)}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-black text-white">{handle}</p>
                            <span className="text-xs font-bold text-gray-500">{formatTakeAge(reply.created_at)}</span>
                          </div>
                          <p className="mt-1 text-sm font-semibold leading-relaxed text-gray-200">{reply.reply_text}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-black/35 p-5 text-center">
                  <p className="text-sm font-black uppercase tracking-[0.12em] text-gray-400">
                    Nobody has talked back yet.
                  </p>
                  <p className="mt-1 text-xs font-semibold text-gray-500">Be the first to defend or pile on.</p>
                </div>
              )}
            </section>
          </>
        ) : (
          <section className="rounded-[1.75rem] border border-red-400/25 bg-red-500/10 p-6 text-center">
            <h2 className="sports-display text-3xl italic text-white">Take not found.</h2>
            <p className="mt-2 text-sm font-semibold text-gray-300">This lock may not exist yet.</p>
          </section>
        )}
      </div>
    </main>
  );
}

function ThreadStat({ label, value, tone }: { label: string; value: string; tone: "lime" | "purple" | "white" }) {
  const toneClass = tone === "lime" ? "text-lime-300" : tone === "purple" ? "text-purple-300" : "text-white";

  return (
    <div className="border-r border-white/10 last:border-r-0">
      <p className="text-[9px] font-black uppercase text-gray-500">{label}</p>
      <p className={`mt-1 text-sm font-black ${toneClass}`}>{value}</p>
    </div>
  );
}

function ThreadReactionButton({
  active,
  disabled,
  side,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  side: Side;
  onClick: () => void;
}) {
  const isRide = side === "ride";

  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`min-h-14 rounded-2xl border px-4 text-left transition hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0 ${
        isRide
          ? active
            ? "border-lime-300 bg-lime-400 text-black shadow-[0_0_28px_rgba(132,204,22,0.26)]"
            : "border-lime-300/45 bg-lime-400/8 text-lime-300 hover:bg-lime-400/12"
          : active
            ? "border-purple-300 bg-purple-500 text-white shadow-[0_0_28px_rgba(168,85,247,0.3)]"
            : "border-purple-300/55 bg-purple-500/10 text-purple-300 hover:bg-purple-500/15"
      }`}
    >
      <span className="block text-xl font-black uppercase tracking-[0.12em]">{isRide ? "Ride" : "Fade"}</span>
      <span className={`mt-1 block text-xs font-black uppercase ${active ? "opacity-80" : "text-gray-400"}`}>
        {isRide ? "Back this take" : "Call it out"}
      </span>
    </button>
  );
}

function formatCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

function formatTakeAge(createdAt: string) {
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

function getInitials(username: string) {
  const cleanUsername = username.replace(/^@/, "").trim();
  const capitalLetters = cleanUsername.match(/[A-Z]/g);

  if (capitalLetters && capitalLetters.length > 1) {
    return capitalLetters.slice(0, 2).join("");
  }

  return cleanUsername.slice(0, 2).toUpperCase() || "ST";
}
