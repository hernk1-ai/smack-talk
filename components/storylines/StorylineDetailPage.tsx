"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LocktLogo } from "@/components/LocktLogo";
import { RouteBottomNav } from "@/components/BottomNav";
import type { WorldCupStoryline } from "@/data/worldCupStorylines";
import { getUserFacingErrorMessage } from "@/lib/userFacingError";
import { createLockedTake } from "@/lib/supabase/takes";
import { getArenaFeedByStorylineId, getCurrentUserReactionMap, type ArenaTake } from "@/lib/supabase/arena";
import { reactToTake } from "@/lib/supabase/reactions";
import { createReply, getRepliesForTake, type TakeReplyWithAuthor } from "@/lib/supabase/replies";
import type { TakeReaction } from "@/lib/supabase/types";

type Side = "ride" | "fade";

export function StorylineDetailPage({ storyline }: { storyline: WorldCupStoryline }) {
  const [takeText, setTakeText] = useState("");
  const [takeStatus, setTakeStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [takeMessage, setTakeMessage] = useState("");
  const [relatedTakes, setRelatedTakes] = useState<ArenaTake[]>([]);
  const [reactions, setReactions] = useState<Record<string, TakeReaction["reaction"]>>({});
  const [reactingTakeId, setReactingTakeId] = useState<string | null>(null);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [expandedRepliesByTake, setExpandedRepliesByTake] = useState<Record<string, boolean>>({});
  const [repliesByTake, setRepliesByTake] = useState<Record<string, TakeReplyWithAuthor[]>>({});
  const [replyDraftByTake, setReplyDraftByTake] = useState<Record<string, string>>({});
  const [replyLoadingTakeId, setReplyLoadingTakeId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadRelatedDiscussion() {
      const { takes } = await getArenaFeedByStorylineId(storyline.id);
      const { reactionMap } = await getCurrentUserReactionMap(takes.map((take) => take.id));

      if (!isMounted) {
        return;
      }

      setRelatedTakes(takes.slice(0, 12));
      setReactions(reactionMap);
      setLoadingRelated(false);
    }

    loadRelatedDiscussion().catch(() => {
      if (isMounted) {
        setLoadingRelated(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [storyline.id]);

  const embedUrl = useMemo(() => toYouTubeEmbedUrl(storyline.videoUrl), [storyline.videoUrl]);

  async function lockStorylineTake() {
    const text = takeText.trim();
    if (!text) {
      setTakeStatus("error");
      setTakeMessage("Write your take first.");
      return;
    }

    setTakeStatus("loading");
    setTakeMessage("");

    const { take, error } = await createLockedTake({ takeText: text, storylineId: storyline.id });
    if (error) {
      setTakeStatus("error");
      setTakeMessage(getUserFacingErrorMessage(error, "Unable to lock your take right now. Try again."));
      return;
    }

    setTakeText("");
    setTakeStatus("success");
    setTakeMessage("Locked before kickoff.");
    if (take) {
      setRelatedTakes((current) => [take as ArenaTake, ...current].slice(0, 12));
    }
  }

  async function react(takeId: string, reaction: Side) {
    setReactingTakeId(takeId);
    const { take, error, reaction: saved } = await reactToTake({ takeId, reaction });

    if (!error && take) {
      setRelatedTakes((current) => current.map((item) => (item.id === take.id ? { ...item, ...take } : item)));
    }
    if (!error && saved) {
      setReactions((current) => ({ ...current, [takeId]: saved.reaction }));
    }
    setReactingTakeId(null);
  }

  async function toggleReplies(takeId: string) {
    const nextOpen = !expandedRepliesByTake[takeId];
    setExpandedRepliesByTake((current) => ({ ...current, [takeId]: nextOpen }));

    if (!nextOpen || repliesByTake[takeId]) {
      return;
    }

    const { replies } = await getRepliesForTake(takeId);
    setRepliesByTake((current) => ({ ...current, [takeId]: replies }));
  }

  async function submitReply(takeId: string) {
    const replyText = (replyDraftByTake[takeId] ?? "").trim();
    if (!replyText || replyLoadingTakeId) {
      return;
    }

    setReplyLoadingTakeId(takeId);
    const { error } = await createReply({ takeId, replyText });
    if (error) {
      setReplyLoadingTakeId(null);
      return;
    }

    const { replies } = await getRepliesForTake(takeId);
    setRepliesByTake((current) => ({ ...current, [takeId]: replies }));
    setReplyDraftByTake((current) => ({ ...current, [takeId]: "" }));
    setRelatedTakes((current) =>
      current.map((take) => (take.id === takeId ? { ...take, reply_count: take.reply_count + 1 } : take)),
    );
    setReplyLoadingTakeId(null);
  }

  return (
    <main className="min-h-dvh overflow-x-hidden bg-transparent py-5 text-white sm:py-6">
      <div className="feed-shell screen-safe-bottom space-y-4 pb-24">
        <header className="rounded-[1.5rem] border border-white/10 bg-black/35 p-3">
          <div className="flex items-center justify-between gap-3">
            <Link href="/app" className="text-xs font-black uppercase tracking-[0.1em] text-lime-300">← Back to Arena</Link>
            <LocktLogo size={48} />
          </div>
        </header>

        <article className="rounded-[1.75rem] border border-white/10 bg-black/35 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-lime-300">{storyline.category}{storyline.relatedGroup ? ` · ${storyline.relatedGroup}` : ""}</p>
          <h1 className="mt-2 text-3xl font-black italic leading-tight text-white sm:text-4xl">{storyline.title}</h1>
          <p className="mt-2 text-sm font-semibold text-gray-300">{storyline.teaser}</p>
          <p className="mt-2 text-xs font-bold uppercase text-gray-500">{formatDate(storyline.createdAt)}</p>
          {embedUrl ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
              <div className="relative w-full pt-[56.25%]">
                <iframe
                  src={embedUrl}
                  title={storyline.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              </div>
            </div>
          ) : null}
          <p className="mt-4 text-sm leading-7 text-gray-200">{storyline.body}</p>
        </article>

        <section className="rounded-[1.75rem] border border-purple-300/30 bg-purple-500/10 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-purple-200">Lock Your Take</p>
          <textarea
            value={takeText}
            onChange={(event) => setTakeText(event.target.value)}
            maxLength={160}
            placeholder="Lock your take from this storyline..."
            className="mt-3 min-h-24 w-full resize-none rounded-xl border border-white/10 bg-black/55 px-3 py-3 text-sm font-semibold text-white outline-none"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-gray-400">{takeText.length}/160</p>
            <button
              type="button"
              onClick={lockStorylineTake}
              disabled={takeStatus === "loading" || !takeText.trim()}
              className="min-h-11 rounded-xl border border-purple-300/55 bg-purple-500/10 px-4 text-xs font-black uppercase tracking-[0.1em] text-purple-100 disabled:opacity-50"
            >
              {takeStatus === "loading" ? "Locking..." : "Lock Take"}
            </button>
          </div>
          {takeMessage ? <p className="mt-2 text-xs font-semibold text-lime-300">{takeMessage}</p> : null}
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-black/35 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black italic text-white">Related Discussion</h2>
            <span className="text-xs font-black uppercase text-gray-400">Latest</span>
          </div>
          {loadingRelated ? (
            <p className="text-sm font-semibold text-gray-400">Loading discussion...</p>
          ) : relatedTakes.length ? (
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {relatedTakes.map((take) => {
                const total = Math.max(take.ride_count + take.fade_count, 1);
                const ridePercent = Math.round((take.ride_count / total) * 100);
                const fadePercent = 100 - ridePercent;
                return (
                  <article key={take.id} className="rounded-xl border border-white/10 bg-black/45 p-3">
                    <p className="text-xs font-black text-lime-300">@{take.author?.username ?? "Talker"}</p>
                    <p className="mt-1 text-sm font-semibold text-white">{take.take_text}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => react(take.id, "ride")}
                        disabled={reactingTakeId === take.id}
                        className={`rounded-lg border px-2 py-1 text-xs font-black uppercase ${reactions[take.id] === "ride" ? "border-lime-300 bg-lime-400/20 text-lime-200" : "border-lime-300/35 text-lime-300"}`}
                      >
                        Ride {ridePercent}%
                      </button>
                      <button
                        type="button"
                        onClick={() => react(take.id, "fade")}
                        disabled={reactingTakeId === take.id}
                        className={`rounded-lg border px-2 py-1 text-xs font-black uppercase ${reactions[take.id] === "fade" ? "border-purple-300 bg-purple-500/20 text-purple-200" : "border-purple-300/35 text-purple-300"}`}
                      >
                        Fade {fadePercent}%
                      </button>
                    </div>
                    <p className="mt-2 text-[11px] font-semibold text-gray-400">Replies {take.reply_count}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button type="button" onClick={() => toggleReplies(take.id)} className="text-xs font-black uppercase text-purple-300">
                        {expandedRepliesByTake[take.id] ? "Hide replies" : "View replies"}
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
                      <input
                        value={replyDraftByTake[take.id] ?? ""}
                        onChange={(event) =>
                          setReplyDraftByTake((current) => ({ ...current, [take.id]: event.target.value }))
                        }
                        placeholder="Reply"
                        className="min-h-10 rounded-lg border border-white/10 bg-black/55 px-3 text-xs font-semibold text-white outline-none placeholder:text-gray-500"
                      />
                      <button
                        type="button"
                        onClick={() => submitReply(take.id)}
                        disabled={replyLoadingTakeId === take.id || !(replyDraftByTake[take.id] ?? "").trim()}
                        className="min-h-10 rounded-lg border border-white/15 bg-white/[0.05] px-3 text-xs font-black uppercase text-white disabled:opacity-50"
                      >
                        {replyLoadingTakeId === take.id ? "..." : "Reply"}
                      </button>
                    </div>
                    {expandedRepliesByTake[take.id] ? (
                      <div className="mt-2 space-y-1 rounded-lg border border-white/10 bg-black/50 p-2">
                        {(repliesByTake[take.id] ?? []).length ? (
                          (repliesByTake[take.id] ?? []).slice(0, 8).map((reply) => (
                            <div key={reply.id} className="border-b border-white/10 pb-1 text-xs last:border-b-0 last:pb-0">
                              <p className="font-black text-gray-200">@{reply.author?.username ?? "Talker"}</p>
                              <p className="font-semibold text-gray-300">{reply.reply_text}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs font-semibold text-gray-400">No replies yet.</p>
                        )}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="text-sm font-semibold text-gray-400">No related takes yet. Be first to lock one.</p>
          )}
        </section>
      </div>
      <RouteBottomNav activeView="arena" />
    </main>
  );
}

function toYouTubeEmbedUrl(url?: string) {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.toString();
      }
      const videoId = parsed.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (parsed.hostname === "youtu.be") {
      const videoId = parsed.pathname.replace("/", "");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
  } catch {
    return null;
  }

  return null;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}
