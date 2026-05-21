"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { RouteBottomNav } from "@/components/BottomNav";
import { worldCupStorylines, type WorldCupStoryline } from "@/data/worldCupStorylines";
import type { Profile } from "@/lib/supabase/types";

export function StorylineDetailPage({ storyline, profile }: { storyline: WorldCupStoryline; profile?: Profile | null }) {
  const embedUrl = useMemo(() => toYouTubeEmbedUrl(storyline.videoUrl), [storyline.videoUrl]);

  const relatedVideos = useMemo(
    () => worldCupStorylines.filter((item) => item.slug !== storyline.slug).slice(0, 5),
    [storyline.slug],
  );

  return (
    <main className="min-h-dvh overflow-x-hidden bg-transparent py-5 text-white sm:py-6">
      <div className="feed-shell screen-safe-bottom space-y-4 pb-24">
        <AppHeader subtitle="Storyline detail and discussion." profile={profile} rightAriaLabel="Arena" />
        <div className="px-1">
          <Link href="/app" className="text-xs font-black uppercase tracking-[0.1em] text-lime-300">← Back to Match Hub</Link>
        </div>

        <article className="rounded-[1.75rem] border border-white/10 bg-black/35 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-lime-300">{storyline.category}{storyline.relatedGroup ? ` · ${storyline.relatedGroup}` : ""}</p>
          <h1 className="mt-2 text-3xl font-black italic leading-tight text-white sm:text-4xl">{storyline.title}</h1>
          <p className="mt-2 text-sm font-semibold text-gray-300">{storyline.teaser}</p>
          <p className="mt-2 text-xs font-bold uppercase text-gray-500">{formatDate(storyline.createdAt)}</p>
          {embedUrl ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
              <div className="relative w-full pt-[56.25%]">
                <iframe
                  src={embedUrl}
                  title={storyline.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              </div>
            </div>
          ) : null}
          <p className="mt-4 text-sm leading-7 text-gray-200">{storyline.body}</p>
        </article>

        <section className="rounded-[1.75rem] border border-purple-300/30 bg-purple-500/10 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black italic text-white">Watch More</h2>
            <span className="text-xs font-black uppercase text-gray-300">Storylines</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {relatedVideos.map((item) => (
              <Link
                key={item.id}
                href={`/storylines/${encodeURIComponent(item.slug)}`}
                className="rounded-xl border border-white/10 bg-black/45 p-3 transition hover:border-purple-300/40"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-purple-200">{item.category}</p>
                <p className="mt-1 text-sm font-black text-white">{item.title}</p>
                <p className="mt-2 text-xs font-semibold text-gray-300">Watch video and join the discussion.</p>
              </Link>
            ))}
          </div>
        </section>

      </div>
      <RouteBottomNav activeView="arena" />
    </main>
  );
}

function toYouTubeEmbedUrl(url?: string) {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.toString();
      }
      const videoId = parsed.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (parsed.hostname === "youtu.be") {
      const videoId = parsed.pathname.replace("/", "");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
  } catch {
    return null;
  }

  return null;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}
