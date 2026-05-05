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
      className={`rounded-2xl border p-4 transition duration-150 active:scale-[0.992] ${
        post.justResolved
          ? "border-purple-500 bg-purple-950/40"
          : post.status === "lost"
            ? "border-red-900/50 bg-red-950/30"
            : post.status === "won"
              ? "border-green-900/50 bg-green-950/30"
              : "border-gray-800 bg-gray-950"
      }`}
    >
      <div className="mb-2 flex justify-between gap-3">
        <span className="text-sm text-gray-400">{post.user}</span>
        <span className="text-right text-xs font-bold">{getBadge(post)}</span>
      </div>

      <p className="text-xs uppercase tracking-wide text-gray-500">{post.game}</p>

      <p className="mt-2 text-lg font-bold leading-tight">“{post.text}”</p>

      <div className="mt-3 grid grid-cols-[auto_auto_1fr] items-center gap-2 rounded-xl bg-white/5 p-3">
        <span className="text-xs font-black text-gray-500">Heat Score</span>
        <strong className="text-xs font-black text-orange-300">{getHeatScore(post)}</strong>
        <em
          key={post.activityText}
          className="animate-[activityPulse_500ms_ease] justify-self-end text-right text-xs not-italic text-gray-200"
        >
          {post.activityText ?? "👀 Picking up traction"}
        </em>
      </div>

      <div className="mt-3 flex justify-between text-sm">
        <span>🔥 {post.riders} riding</span>
        <span>💀 {post.faders} fading</span>
      </div>

      {choice && (
        <p className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-center text-xs font-bold">
          You&apos;re {choice === "ride" ? "riding" : "fading"} this.
        </p>
      )}

      {post.status === "live" && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => onChoose(post.id, "ride")}
            className={`rounded-xl py-2 text-sm font-bold transition hover:shadow-[0_0_18px_rgba(74,222,128,0.3)] active:scale-95 ${
              choice === "ride" ? "bg-green-400 text-black" : "bg-green-600"
            }`}
          >
            Ride
          </button>

          <button
            onClick={() => onChoose(post.id, "fade")}
            className={`rounded-xl py-2 text-sm font-bold transition hover:shadow-[0_0_18px_rgba(168,85,247,0.3)] active:scale-95 ${
              choice === "fade"
                ? "bg-gradient-to-r from-purple-300 to-indigo-300 text-black"
                : "bg-gradient-to-r from-purple-700 to-indigo-700"
            }`}
          >
            Fade
          </button>
        </div>
      )}

      {post.status === "lost" && <p className="mt-3 text-sm text-gray-300">💀 {post.riders} people saw this collapse</p>}

      {post.status === "won" && <p className="mt-3 text-sm text-gray-300">Talk backed up. Receipt secured.</p>}

      {post.justResolved && (
        <p className="mt-3 rounded-xl bg-purple-500/20 px-3 py-2 text-center text-xs font-black text-purple-100">
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
