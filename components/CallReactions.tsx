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
    <div className="mt-3 grid gap-2">
      {reactionKeys.map((reaction) => {
        const isFlashing = flashKey === `${postId}-${reaction}`;

        return (
          <button
            className={`flex min-h-10 items-center justify-between rounded-xl border border-gray-800 bg-white/5 px-3 py-2 text-xs font-black text-gray-200 transition active:scale-95 ${
              isFlashing ? "animate-[reactionBounce_240ms_ease] shadow-[0_0_0_3px_rgba(168,85,247,0.25)]" : ""
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
