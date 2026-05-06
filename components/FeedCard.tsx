"use client";

import { CallReactions } from "@/components/CallReactions";
import {
  type CallReactionCounts,
  type CallReactionKey,
  type Choice,
  type Post,
  getBadge,
  getHeatScore,
} from "@/utils/liveFeed";

export function FeedCard({
  post,
  choice,
  reactionCounts,
  reactionFlashKey,
  onChoose,
  onCallReaction,
}: {
  post: Post;
  choice?: Choice;
  reactionCounts: CallReactionCounts;
  reactionFlashKey?: string;
  onChoose: (id: number, type: Choice) => void;
  onCallReaction: (id: number, reaction: CallReactionKey) => void;
}) {
  return (
    <article
      className={`rounded-3xl border p-4 shadow-[0_18px_44px_rgba(0,0,0,0.28)] transition duration-150 active:scale-[0.992] ${
        post.justResolved
          ? "border-purple-400/60 bg-gradient-to-br from-purple-950/60 to-slate-950 shadow-[0_0_34px_rgba(168,85,247,0.18)]"
          : post.status === "lost"
            ? "border-red-500/25 bg-gradient-to-br from-red-950/35 to-slate-950"
            : post.status === "won"
              ? "border-green-400/25 bg-gradient-to-br from-green-950/35 to-slate-950"
              : "border-white/10 bg-gradient-to-br from-slate-950 via-[#07111f] to-black"
      }`}
    >
      <div className="mb-2 flex justify-between gap-3">
        <span className="text-sm font-black text-gray-200">{post.user}</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-right text-[10px] font-black uppercase">
          {getBadge(post)}
        </span>
      </div>

      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">{post.game}</p>

      <p className="mt-3 text-xl font-black leading-tight text-white">“{post.text}”</p>

      <div className="mt-4 grid grid-cols-[auto_auto_1fr] items-center gap-2 rounded-2xl border border-white/10 bg-black/45 p-3">
        <span className="text-[10px] font-black uppercase text-gray-500">Heat</span>
        <strong className="scoreboard-number text-xl text-orange-300">{getHeatScore(post)}</strong>
        <em
          key={post.activityText}
          className="animate-[activityPulse_500ms_ease] justify-self-end text-right text-xs font-bold not-italic text-gray-200"
        >
          {post.activityText ?? "👀 Picking up traction"}
        </em>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-black">
        <span className="rounded-2xl bg-green-400/10 px-3 py-2 text-green-200">🔥 {post.riders} riding</span>
        <span className="rounded-2xl bg-purple-500/10 px-3 py-2 text-right text-purple-200">💀 {post.faders} fading</span>
      </div>

      {choice && (
        <p className="mt-3 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-center text-xs font-black">
          You&apos;re {choice === "ride" ? "riding" : "fading"} this.
        </p>
      )}

      {post.status === "live" && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => onChoose(post.id, "ride")}
            className={`rounded-2xl py-3 text-sm font-black transition hover:shadow-[0_0_22px_rgba(45,212,191,0.25)] active:scale-95 ${
              choice === "ride" ? "bg-green-300 text-black" : "bg-gradient-to-r from-green-500 to-teal-400 text-black"
            }`}
          >
            Ride
          </button>

          <button
            onClick={() => onChoose(post.id, "fade")}
            className={`rounded-2xl py-3 text-sm font-black transition hover:shadow-[0_0_22px_rgba(168,85,247,0.3)] active:scale-95 ${
              choice === "fade"
                ? "bg-gradient-to-r from-purple-300 to-indigo-300 text-black"
                : "bg-gradient-to-r from-purple-700 to-indigo-700"
            }`}
          >
            Fade
          </button>
        </div>
      )}

      {post.status === "lost" && (
        <p className="mt-3 rounded-2xl bg-red-500/10 px-3 py-2 text-sm font-bold text-red-100">
          💀 {post.riders} people saw this collapse
        </p>
      )}

      {post.status === "won" && (
        <p className="mt-3 rounded-2xl bg-green-400/10 px-3 py-2 text-sm font-bold text-green-100">
          Talk backed up. Receipt secured.
        </p>
      )}

      {post.justResolved && (
        <p className="mt-3 rounded-2xl bg-purple-500/20 px-3 py-2 text-center text-xs font-black text-purple-100">
          JUST RESOLVED — CHECK THE RECEIPT
        </p>
      )}

      <CallReactions
        postId={post.id}
        counts={reactionCounts}
        flashKey={reactionFlashKey}
        onReact={onCallReaction}
      />
    </article>
  );
}
