"use client";

import { useEffect, useState } from "react";
import { ChatMessage } from "@/components/ChatMessage";
import {
  type ArenaMessage,
  type ArenaReactionCounts,
  type ArenaReactionKey,
  createCalloutMessage,
  createLockedCallMessage,
  defaultArenaReactionCounts,
  mockArenaMessages,
} from "@/utils/arenaChat";

type ReactionCountsByMessage = Record<string, ArenaReactionCounts>;

export function ArenaChat() {
  const [visibleMessages, setVisibleMessages] = useState<ArenaMessage[]>(() => mockArenaMessages.slice(0, 3));
  const [nextMessageIndex, setNextMessageIndex] = useState(3);
  const [reactionCounts, setReactionCounts] = useState<ReactionCountsByMessage>(() =>
    buildArenaReactionCounts(mockArenaMessages.slice(0, 3)),
  );
  const [reactionFlashKey, setReactionFlashKey] = useState<string>();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setVisibleMessages((currentMessages) => {
        const nextMessage = mockArenaMessages[nextMessageIndex % mockArenaMessages.length];
        const liveMessage = {
          ...nextMessage,
          id: `${nextMessage.id}-${Date.now()}`,
        };

        setReactionCounts((prev) => ({
          ...prev,
          [liveMessage.id]: defaultArenaReactionCounts,
        }));

        return [...currentMessages.slice(-8), liveMessage];
      });

      setNextMessageIndex((index) => index + 1);
    }, 3600);

    return () => window.clearInterval(timer);
  }, [nextMessageIndex]);

  function handleReact(messageId: string, reaction: ArenaReactionKey) {
    setReactionCounts((prev) => ({
      ...prev,
      [messageId]: {
        ...(prev[messageId] ?? defaultArenaReactionCounts),
        [reaction]: (prev[messageId]?.[reaction] ?? defaultArenaReactionCounts[reaction]) + 1,
      },
    }));
    setReactionFlashKey(`${messageId}-${reaction}`);
    window.setTimeout(() => setReactionFlashKey(undefined), 260);
  }

  function handleCallOut(message: ArenaMessage) {
    const calloutMessage = createCalloutMessage(message.handle);

    setVisibleMessages((currentMessages) => [...currentMessages.slice(-8), calloutMessage]);
    setReactionCounts((prev) => ({
      ...prev,
      [calloutMessage.id]: defaultArenaReactionCounts,
    }));
  }

  function lockArenaCall(action: "Rode LAL" | "Faded GSW") {
    const lockedMessage = createLockedCallMessage(action);

    setVisibleMessages((currentMessages) => [...currentMessages.slice(-8), lockedMessage]);
    setReactionCounts((prev) => ({
      ...prev,
      [lockedMessage.id]: defaultArenaReactionCounts,
    }));
    setIsSheetOpen(false);
  }

  return (
    <section className="relative space-y-3">
      <div className="flex items-center justify-between rounded-t-3xl border border-white/10 border-b-transparent bg-black/35 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.08em]">
          <span className="text-lg">◌</span>
          Live Chat
        </h3>
        <span className="rounded-full border border-purple-300/20 bg-purple-500/15 px-3 py-1 text-[10px] font-black uppercase text-purple-200">
          1.2K
        </span>
      </div>

      <div className="space-y-3 rounded-b-3xl border border-white/10 bg-black/20 p-3 pt-0">
        {visibleMessages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            reactionCounts={reactionCounts[message.id] ?? defaultArenaReactionCounts}
            reactionFlashKey={reactionFlashKey}
            onReact={handleReact}
            onCallOut={handleCallOut}
            onBackItUp={() => setIsSheetOpen(true)}
          />
        ))}
      </div>

      <div className="sticky bottom-3 rounded-3xl border border-white/10 bg-black/75 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur">
        <div className="flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-purple-400 to-sky-300 text-xs font-black text-black">
            ST
          </span>
          <input
            aria-label="Join the conversation"
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-gray-500"
            placeholder="Join the conversation..."
            readOnly
          />
          <button className="min-h-10 rounded-full bg-white px-3 py-1.5 text-xs font-black text-black" type="button">
            Send
          </button>
        </div>
      </div>

      {isSheetOpen && (
        <div className="safe-bottom-sheet fixed inset-0 z-40 flex items-end bg-black/75 px-4 backdrop-blur-sm">
          <div className="arena-surface mx-auto w-full max-w-md rounded-t-[2rem] border border-white/10 p-5 shadow-2xl">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />
            <p className="sports-display text-3xl leading-none">Lock a call</p>
            <p className="mt-1 text-sm text-gray-400">Choose your side. No switching sides.</p>

            <div className="mt-5 grid gap-3">
              <button
                onClick={() => lockArenaCall("Rode LAL")}
                className="rounded-2xl bg-gradient-to-r from-green-400 to-teal-300 py-3 text-sm font-black text-black shadow-[0_0_24px_rgba(45,212,191,0.22)] transition active:scale-95"
              >
                Ride LAL
              </button>
              <button
                onClick={() => lockArenaCall("Faded GSW")}
                className="rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 py-3 text-sm font-black text-white transition active:scale-95"
              >
                Fade GSW
              </button>
              <button
                onClick={() => setIsSheetOpen(false)}
                className="rounded-2xl border border-gray-800 py-3 text-sm font-black text-gray-300 transition active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function buildArenaReactionCounts(messages: ArenaMessage[]) {
  return messages.reduce<ReactionCountsByMessage>((counts, message, index) => {
    counts[message.id] = {
      fire: index + 2,
      devil: index % 2,
      clown: index === 0 ? 1 : 0,
      brain: index + 1,
    };
    return counts;
  }, {});
}
