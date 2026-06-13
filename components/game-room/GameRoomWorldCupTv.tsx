"use client";

import { useCallback, useEffect, useState } from "react";

import { WorldCupVideoCard } from "@/components/game-room/WorldCupVideoCard";
import type { WorldCupVideo } from "@/lib/worldCup/worldCupVideos";

type GameRoomWorldCupTvProps = {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
};

export function GameRoomWorldCupTv({ gameId, homeTeam, awayTeam }: GameRoomWorldCupTvProps) {
  const [video, setVideo] = useState<WorldCupVideo | null>(null);
  const [loading, setLoading] = useState(true);

  const loadVideo = useCallback(async () => {
    const params = new URLSearchParams({ gameId, homeTeam, awayTeam });
    const response = await fetch(`/api/game-room/video?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as { video?: WorldCupVideo | null } | null;
    setVideo(payload?.video ?? null);
    setLoading(false);
  }, [gameId, homeTeam, awayTeam]);

  useEffect(() => {
    void loadVideo();
  }, [loadVideo]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadVideo();
    }, 5 * 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, [loadVideo]);

  if (loading || !video) {
    return null;
  }

  return (
    <WorldCupVideoCard
      title={video.title}
      sourceLabel={video.sourceLabel}
      youtubeId={video.youtubeId}
      category={video.category}
    />
  );
}
