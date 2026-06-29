"use client";

import { useEffect, useState } from "react";

import { fetchGameRoomPulse } from "@/lib/gameRoom/pulseApi";
import type { PulseItem } from "@/lib/gameRoom/pulse";

type RoomStatus = "scheduled" | "live" | "final" | "awaiting";

type GameRoomPulseProps = {
  gameId: string;
  roomCode?: string | null;
  roomStatus: RoomStatus;
};

function getPollIntervalMs(roomStatus: RoomStatus) {
  return roomStatus === "live" ? 30_000 : 75_000;
}

export function GameRoomPulse({ gameId, roomCode = null, roomStatus }: GameRoomPulseProps) {
  const [items, setItems] = useState<PulseItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function refresh() {
      const pulse = await fetchGameRoomPulse(gameId, roomCode);
      if (isMounted) {
        setItems(pulse?.items ?? []);
      }
    }

    void refresh();
    const intervalId = window.setInterval(() => {
      void refresh();
    }, getPollIntervalMs(roomStatus));

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [gameId, roomCode, roomStatus]);

  if (!items.length) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-lime-300/15 bg-black/30 p-3 shadow-[0_14px_36px_rgba(0,0,0,0.28)]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lime-300">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-lime-400 shadow-[0_0_12px_rgba(132,204,22,0.65)]" />
          Lockt Pulse
        </p>
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">Room momentum</p>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={`${item.type}-${item.text}`}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
          >
            <p className="text-xs font-semibold leading-snug text-gray-200">
              <span aria-hidden="true" className="mr-1.5">
                {item.emoji}
              </span>
              {item.text}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
