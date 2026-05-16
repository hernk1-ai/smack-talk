"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { RouteBottomNav } from "@/components/BottomNav";
import { ReportModal } from "@/components/moderation/ReportModal";
import { SmackTalkLogo } from "@/components/SmackTalkLogo";
import { UserAvatar } from "@/components/UserAvatar";
import { getSeededProfileById, getSeededRepliesForTake } from "@/data/seededCrowd";
import { formatTakeForUI, getTakeById, isSeededTakeId, profileToCard, type ArenaTake } from "@/lib/supabase/arena";
import { blockUser, muteUser, type ReportTargetType } from "@/lib/supabase/moderation";
import { getMyReactionForTake, reactToTake } from "@/lib/supabase/reactions";
import { createReply, getRepliesForTake, type TakeReplyWithAuthor } from "@/lib/supabase/replies";
import type { Profile, TakeReaction } from "@/lib/supabase/types";

type Side = "ride" | "fade";

export function TakeThreadScreen({ takeId, profile }: { takeId: string; profile?: Profile | null }) {
  const router = useRouter();
  const [take, setTake] = useState<ArenaTake | null>(null);
  const [replies, setReplies] = useState<TakeReplyWithAuthor[]>([]);
  const [replyingTo, setReplyingTo] = useState<TakeReplyWithAuthor | null>(null);
  const [reaction, setReaction] = useState<TakeReaction["reaction"] | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [reactionLoading, setReactionLoading] = useState(false);
  const [replyStatus, setReplyStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: ReportTargetType; id: string }>({ type: "take", id: takeId });

  useEffect(() => {
    let isMounted = true;

    async function loadThread() {
      setLoading(true);
      const isSeededTake = isSeededTakeId(takeId);
      const [{ take: loadedTake, error: takeError }, { replies: loadedReplies }, { reaction: loadedReaction }] =
        await Promise.all([
          getTakeById(takeId),
          isSeededTake ? Promise.resolve({ replies: getSeededThreadReplies(takeId) }) : getRepliesForTake(takeId),
          isSeededTake ? Promise.resolve({ reaction: null }) : getMyReactionForTake(takeId),
        ]);

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

    if (isSeededTakeId(takeId)) {
      setTake((currentTake) => {
        if (!currentTake || reaction === side) {
          return currentTake;
        }

        const wasRide = reaction === "ride";
        const wasFade = reaction === "fade";
        const nextRideCount = Math.max(currentTake.ride_count + (side === "ride" ? 1 : 0) - (wasRide ? 1 : 0), 0);
        const nextFadeCount = Math.max(currentTake.fade_count + (side === "fade" ? 1 : 0) - (wasFade ? 1 : 0), 0);

        return {
          ...currentTake,
          ride_count: nextRideCount,
          fade_count: nextFadeCount,
          heat: nextRideCount + nextFadeCount + currentTake.reply_count * 2,
        };
      });
      setReaction(side);
      setReactionLoading(false);
      return;
    }

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

    if (isSeededTakeId(takeId)) {
      const cleanReplyText = replyText.trim();

      if (!cleanReplyText) {
        setReplyStatus("error");
        setMessage("Say something before you reply.");
        return;
      }

      if (cleanReplyText.length > 280) {
        setReplyStatus("error");
        setMessage("Keep replies under 280 characters.");
        return;
      }

      const localReply: TakeReplyWithAuthor = {
        id: `seeded_local_reply_${Date.now()}`,
        take_id: takeId,
        user_id: profile?.id ?? "seeded_local_user",
        parent_reply_id: replyingTo?.id ?? null,
        reply_text: cleanReplyText,
        heat: 0,
        is_hidden: false,
        moderation_status: "clear",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author: profileToCard(profile),
      };

      setReplies((currentReplies) => [...currentReplies, localReply]);
      setTake((currentTake) =>
        currentTake
          ? {
              ...currentTake,
              reply_count: currentTake.reply_count + 1,
              heat: currentTake.heat + 2,
            }
          : currentTake,
      );
      setReplyText("");
      setReplyingTo(null);
      setReplyStatus("success");
      setMessage("Demo reply added locally. Lock a real take to make it permanent.");
      return;
    }

    const { reply, error } = await createReply({ takeId, replyText, parentReplyId: replyingTo?.id });

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
      setTake((currentTake) => ({
        ...updatedTake,
        reply_count: Math.max(updatedTake.reply_count, currentTake?.reply_count ?? 0, replies.length + 1),
        heat: Math.max(updatedTake.heat, currentTake?.heat ?? 0),
      }));
    } else {
      setTake((currentTake) =>
        currentTake
          ? {
              ...currentTake,
              reply_count: Math.max(currentTake.reply_count + 1, replies.length + 1),
              heat: currentTake.heat + 2,
            }
          : currentTake,
      );
    }

    setReplyText("");
    setReplyingTo(null);
    setReplyStatus("success");
    setMessage("Reply posted. Everyone can see it.");
  }

  async function shareTakeThread() {
    const shareUrl = window.location.origin + "/take/" + encodeURIComponent(takeId);

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Smack Talk Take",
          text: "Public take thread",
          url: shareUrl,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        copyTextFallback(shareUrl);
      }

      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 1800);
    } catch {
      setMessage("Could not share this take link.");
    }
  }

  function openReport(type: ReportTargetType, id: string) {
    setReportTarget({ type, id });
    setReportOpen(true);
  }

  async function handleMuteUser(userId: string) {
    const { error } = await muteUser(userId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("User muted. Refreshing thread...");
    const { replies: loadedReplies } = await getRepliesForTake(takeId);
    setReplies(loadedReplies);
  }

  async function handleBlockUser(userId: string) {
    const { error } = await blockUser(userId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("User blocked. Refreshing thread...");
    const { replies: loadedReplies } = await getRepliesForTake(takeId);
    setReplies(loadedReplies);
  }

  function goBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/app");
  }

  const author = take ? formatTakeForUI(take) : null;
  const canPostReply = replyStatus !== "loading" && replyText.trim().length > 0;
  const visibleReplyCount = take ? Math.max(take.reply_count, replies.length) : replies.length;
  const rootReplies = replies.filter((reply) => !reply.parent_reply_id);
  const childRepliesByParent = replies.reduce<Record<string, TakeReplyWithAuthor[]>>((accumulator, reply) => {
    if (reply.parent_reply_id) {
      accumulator[reply.parent_reply_id] = [...(accumulator[reply.parent_reply_id] ?? []), reply];
    }

    return accumulator;
  }, {});

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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openReport("take", takeId)}
                  className="min-h-11 rounded-2xl border border-yellow-300/45 bg-yellow-500/15 px-3 text-[10px] font-black uppercase tracking-[0.1em] text-yellow-100 transition hover:bg-yellow-500/25"
                >
                  FLAG
                </button>
                <button
                  type="button"
                  onClick={shareTakeThread}
                  className="min-h-11 rounded-2xl border border-purple-300/45 bg-purple-500/15 px-3 text-[10px] font-black uppercase tracking-[0.1em] text-purple-100 transition hover:bg-purple-500/25"
                >
                  {shareCopied ? "LINK COPIED" : "SHARE"}
                </button>
              </div>
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
                  <Link
                    href={getReceiptHref(author?.handle ?? "@LockedTalker")}
                    className="rounded-full transition hover:scale-105 active:scale-95"
                    aria-label={`${author?.handle ?? "@LockedTalker"} receipts`}
                  >
                    <UserAvatar avatarUrl={author?.avatarUrl} initials={author?.initials ?? "ST"} size="md" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={getReceiptHref(author?.handle ?? "@LockedTalker")}
                        className="text-sm font-black text-white transition hover:text-lime-200"
                      >
                        {author?.handle ?? "@LockedTalker"}
                      </Link>
                      <span className="text-sky-300">◆</span>
                      <span className="text-xs font-bold text-gray-500">{formatTakeAge(take.created_at)}</span>
                    </div>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-purple-300">
                      {take.game_id.replaceAll("-", " ")}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openReport("user", take.user_id)}
                        className="rounded-md border border-yellow-300/35 bg-yellow-500/10 px-2 py-1 text-[9px] font-black uppercase text-yellow-200"
                      >
                        Flag User
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMuteUser(take.user_id)}
                        className="rounded-md border border-white/25 bg-white/5 px-2 py-1 text-[9px] font-black uppercase text-gray-200"
                      >
                        Mute User
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBlockUser(take.user_id)}
                        className="rounded-md border border-red-300/35 bg-red-500/10 px-2 py-1 text-[9px] font-black uppercase text-red-200"
                      >
                        Block User
                      </button>
                    </div>
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
                  <ThreadStat label="Replies" value={formatCompact(visibleReplyCount)} tone="white" />
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
                    {visibleReplyCount} replies
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
                    placeholder="Talk back... 🔥 😂 🧾"
                    className="min-h-24 w-full resize-none rounded-2xl border border-purple-300/45 bg-black/55 px-4 py-4 pr-16 text-base font-semibold text-white outline-none transition placeholder:text-gray-600 focus:border-lime-300/60 focus:shadow-[0_0_24px_rgba(132,204,22,0.12)]"
                  />
                  <span className="absolute bottom-3 right-4 text-xs font-bold text-gray-500">{replyText.length}/280</span>
                </div>
                {replyingTo && (
                  <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-purple-300/25 bg-purple-500/10 px-3 py-2">
                    <p className="truncate text-xs font-bold text-purple-100">
                      Replying to @{replyingTo.author?.username ?? "Talker"}
                    </p>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-400 transition hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                )}
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
                    {rootReplies.map((reply) => {
                      const username = reply.author?.username ?? "Talker";
                      const handle = username.startsWith("@") ? username : `@${username}`;
                      const childReplies = childRepliesByParent[reply.id] ?? [];

                      return (
                        <article key={reply.id} className="border-b border-white/10 p-3 last:border-b-0">
                          <div className="grid grid-cols-[auto_1fr] gap-3">
                            <Link
                              href={getReceiptHref(handle)}
                              className="rounded-full transition hover:scale-105 active:scale-95"
                              aria-label={`${handle} receipts`}
                            >
                              <UserAvatar avatarUrl={reply.author?.avatar_url} initials={getInitials(username)} size="sm" />
                            </Link>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <Link
                                  href={getReceiptHref(handle)}
                                  className="truncate text-sm font-black text-white transition hover:text-lime-200"
                                >
                                  {handle}
                                </Link>
                                <span className="text-xs font-bold text-gray-500">{formatTakeAge(reply.created_at)}</span>
                              </div>
                              <p className="mt-1 text-sm font-semibold leading-relaxed text-gray-200">{reply.reply_text}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingTo(reply);
                                    setReplyStatus("idle");
                                    setMessage("");
                                  }}
                                  className="text-[10px] font-black uppercase tracking-[0.12em] text-purple-300 transition hover:text-lime-200"
                                >
                                  Reply
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openReport("reply", reply.id)}
                                  className="text-[10px] font-black uppercase tracking-[0.12em] text-yellow-300 transition hover:text-yellow-100"
                                >
                                  Flag Reply
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMuteUser(reply.user_id)}
                                  className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-300 transition hover:text-white"
                                >
                                  Mute User
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleBlockUser(reply.user_id)}
                                  className="text-[10px] font-black uppercase tracking-[0.12em] text-red-300 transition hover:text-red-100"
                                >
                                  Block User
                                </button>
                              </div>
                            </div>
                          </div>

                          {childReplies.length > 0 && (
                            <div className="ml-10 mt-3 space-y-2 border-l border-purple-300/20 pl-3">
                              {childReplies.map((childReply) => {
                                const childUsername = childReply.author?.username ?? "Talker";
                                const childHandle = childUsername.startsWith("@") ? childUsername : `@${childUsername}`;

                                return (
                                  <div key={childReply.id} className="grid grid-cols-[auto_1fr] gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                                    <Link
                                      href={getReceiptHref(childHandle)}
                                      className="rounded-full transition hover:scale-105 active:scale-95"
                                      aria-label={`${childHandle} receipts`}
                                    >
                                      <UserAvatar
                                        avatarUrl={childReply.author?.avatar_url}
                                        initials={getInitials(childUsername)}
                                        size="sm"
                                      />
                                    </Link>
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <Link
                                          href={getReceiptHref(childHandle)}
                                          className="truncate text-xs font-black text-white transition hover:text-lime-200"
                                        >
                                          {childHandle}
                                        </Link>
                                        <span className="text-[10px] font-bold text-gray-500">
                                          {formatTakeAge(childReply.created_at)}
                                        </span>
                                      </div>
                                      <p className="mt-1 text-xs font-semibold leading-relaxed text-gray-300">
                                        {childReply.reply_text}
                                      </p>
                                      <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => openReport("reply", childReply.id)}
                                          className="text-[10px] font-black uppercase tracking-[0.12em] text-yellow-300 transition hover:text-yellow-100"
                                        >
                                          Flag Reply
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleMuteUser(childReply.user_id)}
                                          className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-300 transition hover:text-white"
                                        >
                                          Mute User
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleBlockUser(childReply.user_id)}
                                          className="text-[10px] font-black uppercase tracking-[0.12em] text-red-300 transition hover:text-red-100"
                                        >
                                          Block User
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-black/35 p-5 text-center">
                    <p className="text-sm font-black uppercase tracking-[0.12em] text-gray-400">Nobody has talked back yet.</p>
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

        <ReportModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
        />
      </main>
      <RouteBottomNav activeView="arena" />
    </>
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

function copyTextFallback(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Copy command failed.");
  }
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

function getReceiptHref(handle: string) {
  return `/receipts/${handle.replace(/^@/, "").toLowerCase()}`;
}

function getSeededThreadReplies(takeId: string): TakeReplyWithAuthor[] {
  return getSeededRepliesForTake(takeId).map((reply) => {
    const author = getSeededProfileById(reply.userId);

    return {
      id: reply.id,
      take_id: reply.takeId,
      user_id: reply.userId,
      parent_reply_id: reply.parentReplyId ?? null,
      reply_text: reply.replyText,
      heat: 0,
      is_hidden: false,
      moderation_status: "clear",
      created_at: reply.created_at,
      updated_at: reply.created_at,
      author: author
        ? {
            id: author.id,
            username: author.username,
            avatar_url: null,
            reputation_score: author.reputation_score,
            created_takes_count: author.created_takes_count,
          }
        : null,
    };
  });
}
