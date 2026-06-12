"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchRoomChatMessages, type MatchRoomMessage } from "@/lib/gameRoom/chatApi";

type FansAreSayingProps = {
  gameId: string;
  roomCode?: string | null;
};

export function FansAreSaying({ gameId, roomCode = null }: FansAreSayingProps) {
  const [messages, setMessages] = useState<MatchRoomMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMessages = useCallback(async () => {
    const { messages: nextMessages } = await fetchRoomChatMessages(gameId, roomCode);
    setMessages(nextMessages.slice(0, 4));
    setLoading(false);
  }, [gameId, roomCode]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadMessages();
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [loadMessages]);

  if (loading) {
    return (
      <section className="rounded-[1.5rem] border border-white/10 bg-black/35 p-4">
        <p className="text-xs font-semibold text-gray-400">Loading room chatter…</p>
      </section>
    );
  }

  if (!messages.length) {
    return (
      <section className="rounded-[1.5rem] border border-white/10 bg-black/35 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lime-300">Fans Are Saying</p>
        <p className="mt-2 text-sm font-semibold text-gray-400">Be the first to say something about the match.</p>
      </section>
    );
  }

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-black/35 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lime-300">Fans Are Saying</p>
      <ul className="mt-3 space-y-2">
        {messages.map((message) => (
          <li key={message.id} className="rounded-xl border border-white/10 bg-black/40 px-3 py-2">
            <p className="text-[10px] font-black uppercase tracking-[0.08em] text-gray-500">
              {message.displayName?.trim() || "Fan"}
            </p>
            <p className="mt-1 text-sm font-semibold leading-snug text-gray-200">{message.messageText}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
