"use client";

import {
  type ArenaMessage,
  type ArenaReactionCounts,
  type ArenaReactionKey,
  arenaReactionLabels,
} from "@/utils/arenaChat";

export function ChatMessage({
  message,
  reactionCounts,
  reactionFlashKey,
  onReact,
  onCallOut,
  onBackItUp,
}: {
  message: ArenaMessage;
  reactionCounts: ArenaReactionCounts;
  reactionFlashKey?: string;
  onReact: (messageId: string, reaction: ArenaReactionKey) => void;
  onCallOut: (message: ArenaMessage) => void;
  onBackItUp: () => void;
}) {
  if (message.type === "system_moment") {
    return (
      <div className="animate-[activityPulse_420ms_ease] rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-center">
        <p className="text-sm font-black text-yellow-100">{message.message}</p>
        <p className="mt-1 text-[11px] font-bold uppercase text-yellow-200/70">{message.timestamp}</p>
      </div>
    );
  }

  if (message.type === "callout") {
    return (
      <article className="animate-[activityPulse_420ms_ease] rounded-2xl border border-purple-500/40 bg-purple-500/10 p-4 shadow-[0_0_24px_rgba(168,85,247,0.12)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-purple-200">Callout</p>
            <p className="mt-1 text-sm font-bold text-white">{message.message}</p>
          </div>
          <span className="text-[11px] font-bold text-gray-500">{message.timestamp}</span>
        </div>

        <button
          onClick={onBackItUp}
          className="mt-3 w-full rounded-xl bg-white py-2 text-xs font-black text-black transition active:scale-95"
        >
          Back It Up 🔒
        </button>
      </article>
    );
  }

  const isLockedCall = message.type === "locked_call";

  return (
    <article
      className={`animate-[activityPulse_420ms_ease] rounded-2xl border p-4 transition active:scale-[0.992] ${
        isLockedCall
          ? "border-green-400/40 bg-green-500/10 shadow-[0_0_24px_rgba(45,212,191,0.12)]"
          : "border-gray-800 bg-gray-950"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-black">{message.handle}</p>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase text-gray-300">
              {message.badge}
            </span>
          </div>

          {isLockedCall && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-green-400 px-3 py-1 text-[10px] font-black uppercase text-black">
              CALL LOCKED
              <span className="h-1 w-1 rounded-full bg-black/60" />
              {message.actionLabel}
            </div>
          )}
        </div>

        <span className="text-[11px] font-bold text-gray-500">{message.timestamp}</span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-gray-100">{message.message}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(arenaReactionLabels) as ArenaReactionKey[]).map((reaction) => {
          const flashId = `${message.id}-${reaction}`;

          return (
            <button
              key={reaction}
              onClick={() => onReact(message.id, reaction)}
              className={`rounded-full border border-gray-800 bg-black px-2.5 py-1 text-xs font-black transition active:scale-95 ${
                reactionFlashKey === flashId ? "animate-[reactionBounce_240ms_ease] border-white shadow-[0_0_16px_rgba(255,255,255,0.16)]" : ""
              }`}
            >
              {arenaReactionLabels[reaction]} {reactionCounts[reaction]}
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] font-black text-gray-300">
        <button onClick={() => onCallOut(message)} className="rounded-xl bg-white/10 py-2 transition active:scale-95">
          😈 Call Out
        </button>
        <button
          onClick={() => onReact(message.id, "fire")}
          className="rounded-xl bg-white/10 py-2 transition active:scale-95"
        >
          🔥 React
        </button>
        <button className="rounded-xl bg-white/10 py-2 text-gray-500 transition active:scale-95">Reply</button>
      </div>
    </article>
  );
}
