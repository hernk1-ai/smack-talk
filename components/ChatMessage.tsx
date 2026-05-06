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
      <div className="animate-[activityPulse_420ms_ease] rounded-3xl border border-yellow-400/25 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-yellow-500/10 px-4 py-3 text-center shadow-[0_0_28px_rgba(250,204,21,0.08)]">
        <p className="sports-display text-xl leading-none text-yellow-100">{message.message}</p>
        <p className="mt-1 text-[11px] font-bold uppercase text-yellow-200/70">{message.timestamp}</p>
      </div>
    );
  }

  if (message.type === "callout") {
    return (
      <article className="animate-[activityPulse_420ms_ease] rounded-3xl border border-purple-400/35 bg-gradient-to-br from-purple-500/14 to-slate-950 p-4 shadow-[0_0_30px_rgba(168,85,247,0.13)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-200">Callout</p>
            <p className="mt-1 text-sm font-bold text-white">{message.message}</p>
          </div>
          <span className="text-[11px] font-bold text-gray-500">{message.timestamp}</span>
        </div>

        <button
          onClick={onBackItUp}
          className="mt-3 w-full rounded-2xl bg-white py-2.5 text-xs font-black text-black shadow-[0_0_22px_rgba(255,255,255,0.12)] transition active:scale-95"
        >
          Back It Up 🔒
        </button>
      </article>
    );
  }

  const isLockedCall = message.type === "locked_call";
  const isFadeCall = message.actionLabel?.toLowerCase().includes("faded");
  const lockedClass = isFadeCall
    ? "border-purple-400/45 bg-purple-500/10 shadow-[0_0_28px_rgba(168,85,247,0.14)]"
    : "border-green-300/45 bg-green-400/10 shadow-[0_0_28px_rgba(45,212,191,0.14)]";
  const lockedBadgeClass = isFadeCall
    ? "bg-gradient-to-r from-purple-300 to-indigo-300 text-black"
    : "bg-green-300 text-black";

  return (
    <article
      className={`animate-[activityPulse_420ms_ease] rounded-3xl border p-4 transition active:scale-[0.992] ${
        isLockedCall ? lockedClass : "border-white/10 bg-gradient-to-br from-slate-950 to-black shadow-[0_18px_44px_rgba(0,0,0,0.24)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-black text-black ${
              isLockedCall
                ? isFadeCall
                  ? "bg-gradient-to-br from-purple-300 to-indigo-300"
                  : "bg-gradient-to-br from-green-300 to-teal-300"
                : "bg-gradient-to-br from-slate-200 to-slate-500"
            }`}
          >
            {getInitials(message.handle)}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-black">{message.handle}</p>
              <span className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase text-gray-300">
                {message.badge}
              </span>
            </div>

            {isLockedCall && (
              <div
                className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase ${lockedBadgeClass}`}
              >
                CALL LOCKED
                <span className="h-1 w-1 rounded-full bg-black/60" />
                {message.actionLabel}
              </div>
            )}
          </div>
        </div>

        <span className="shrink-0 rounded-full bg-white/5 px-2 py-1 text-[10px] font-black uppercase text-gray-500">
          {message.timestamp}
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-gray-100">{message.message}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(arenaReactionLabels) as ArenaReactionKey[]).map((reaction) => {
          const flashId = `${message.id}-${reaction}`;

          return (
            <button
              key={reaction}
              onClick={() => onReact(message.id, reaction)}
              className={`rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-xs font-black transition hover:border-white/20 active:scale-95 ${
                reactionFlashKey === flashId
                  ? "animate-[reactionBounce_240ms_ease] border-white shadow-[0_0_16px_rgba(255,255,255,0.16)]"
                  : ""
              }`}
            >
              {arenaReactionLabels[reaction]} {reactionCounts[reaction]}
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] font-black text-gray-300">
        <button onClick={() => onCallOut(message)} className="rounded-2xl bg-white/10 py-2 transition active:scale-95">
          😈 Call Out
        </button>
        <button
          onClick={() => onReact(message.id, "fire")}
          className="rounded-2xl bg-white/10 py-2 transition active:scale-95"
        >
          🔥 React
        </button>
        <button className="rounded-2xl bg-white/10 py-2 text-gray-500 transition active:scale-95">Reply</button>
      </div>
    </article>
  );
}

function getInitials(handle: string) {
  const cleanHandle = handle.replace("@", "");

  if (!cleanHandle || cleanHandle.toLowerCase() === "arena") return "ST";

  return cleanHandle.slice(0, 2).toUpperCase();
}
