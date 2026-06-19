"use client";

import { useEffect, useState } from "react";

import { CompanionVideoCard } from "@/components/world-cup/CompanionVideoCard";
import type { WorldCupVideo } from "@/lib/worldCup/worldCupVideos";

const NEWS_DESK_HEADER = "World Cup News Desk";
const NEWS_DESK_SUBTITLE =
  "Latest injury reports, lineup updates, press conferences, and tournament news.";
const NEWS_DESK_EMPTY_SUBTITLE = "Latest tournament news will appear here as kickoff approaches.";

export function MatchHubWorldCupNews() {
  const [video, setVideo] = useState<WorldCupVideo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadVideo() {
      const response = await fetch("/api/match-hub/news", {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => null)) as { video?: WorldCupVideo | null } | null;
      if (!mounted) {
        return;
      }
      setVideo(payload?.video ?? null);
      setLoading(false);
    }

    void loadVideo();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function refreshVideo() {
      const response = await fetch("/api/match-hub/news", {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => null)) as { video?: WorldCupVideo | null } | null;
      if (!mounted) {
        return;
      }
      setVideo(payload?.video ?? null);
      setLoading(false);
    }

    const intervalId = window.setInterval(() => {
      void refreshVideo();
    }, 5 * 60 * 1000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  if (loading) {
    return <NewsDeskEmptyState />;
  }

  if (!video) {
    return <NewsDeskEmptyState />;
  }

  return (
    <CompanionVideoCard
      headerLabel={NEWS_DESK_HEADER}
      subtitle={NEWS_DESK_SUBTITLE}
      title={video.title}
      sourceLabel={video.sourceLabel}
      youtubeId={video.youtubeId}
      category={video.category}
    />
  );
}

function NewsDeskEmptyState() {
  return (
    <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-black/30 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.34)]">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lime-300">{NEWS_DESK_HEADER}</p>
        <p className="mt-1 text-sm font-semibold text-gray-300">{NEWS_DESK_EMPTY_SUBTITLE}</p>
      </div>
    </section>
  );
}
