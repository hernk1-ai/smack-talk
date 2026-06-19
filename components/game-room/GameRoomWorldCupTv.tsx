"use client";

import { useEffect, useState } from "react";

import { WorldCupVideoCard } from "@/components/game-room/WorldCupVideoCard";
import type { WorldCupMatchPhase } from "@/lib/worldCup/matchPhase";
import type { WorldCupVideo } from "@/lib/worldCup/worldCupVideos";

type GameRoomWorldCupTvProps = {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
};

export function GameRoomWorldCupTv({ gameId, homeTeam, awayTeam }: GameRoomWorldCupTvProps) {
  const [video, setVideo] = useState<WorldCupVideo | null>(null);
  const [matchPhase, setMatchPhase] = useState<WorldCupMatchPhase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadVideo() {
      const params = new URLSearchParams({ gameId, homeTeam, awayTeam });
      const response = await fetch(`/api/game-room/video?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => null)) as {
        video?: WorldCupVideo | null;
        matchPhase?: WorldCupMatchPhase;
      } | null;

      if (!mounted) {
        return;
      }

      setVideo(payload?.video ?? null);
      setMatchPhase(payload?.matchPhase ?? null);
      setLoading(false);
    }

    void loadVideo();

    return () => {
      mounted = false;
    };
  }, [gameId, homeTeam, awayTeam]);

  useEffect(() => {
    let mounted = true;

    async function refreshVideo() {
      const params = new URLSearchParams({ gameId, homeTeam, awayTeam });
      const response = await fetch(`/api/game-room/video?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => null)) as {
        video?: WorldCupVideo | null;
        matchPhase?: WorldCupMatchPhase;
      } | null;

      if (!mounted) {
        return;
      }

      setVideo(payload?.video ?? null);
      setMatchPhase(payload?.matchPhase ?? null);
      setLoading(false);
    }

    const intervalId = window.setInterval(() => {
      void refreshVideo();
    }, 5 * 60 * 1000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [gameId, homeTeam, awayTeam]);

  if (loading || !video) {
    return null;
  }

  return (
    <WorldCupVideoCard
      title={video.title}
      sourceLabel={video.sourceLabel}
      youtubeId={video.youtubeId}
      category={video.category}
      matchPhase={matchPhase ?? undefined}
    />
  );
}
