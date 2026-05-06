"use client";

import {
  type CallReactionCounts,
  type CallReactionKey,
  callReactionLabels,
} from "@/utils/liveFeed";

const reactionKeys: CallReactionKey[] = ["fire", "cooked", "sharp"];

export function CallReactions({
  postId,
  counts,
  flashKey,
  onReact,
}: {
  postId: number;
  counts: CallReactionCounts;
  flashKey?: string;
  onReact: (postId: number, reaction: CallReactionKey) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {reactionKeys.map((reaction) => {
        const isFlashing = flashKey === `${postId}-${reaction}`;

        return (
          <button
            className={`inline-flex min-h-9 flex-1 items-center justify-between gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-2 text-[11px] font-black text-gray-200 transition hover:border-white/20 active:scale-95 ${
              isFlashing ? "animate-[reactionBounce_240ms_ease] shadow-[0_0_0_3px_rgba(168,85,247,0.22)]" : ""
            }`}
            key={reaction}
            type="button"
            onClick={() => onReact(postId, reaction)}
          >
            <span>{callReactionLabels[reaction]}</span>
            <strong className="text-gray-400">{counts[reaction]}</strong>
          </button>
        );
      })}
    </div>
  );
}
