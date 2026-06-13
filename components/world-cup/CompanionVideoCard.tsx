import { buildYoutubeWatchUrl } from "@/lib/worldCup/youtube";
import { WORLD_CUP_VIDEO_CATEGORY_LABELS, type WorldCupVideoCategory } from "@/lib/worldCup/worldCupVideos";

type CompanionVideoCardProps = {
  headerLabel: string;
  subtitle: string;
  title: string;
  sourceLabel?: string | null;
  youtubeId: string;
  category: WorldCupVideoCategory;
};

export function CompanionVideoCard({
  headerLabel,
  subtitle,
  title,
  sourceLabel,
  youtubeId,
  category,
}: CompanionVideoCardProps) {
  const watchUrl = buildYoutubeWatchUrl(youtubeId);
  const embedUrl = `https://www.youtube.com/embed/${youtubeId}`;

  return (
    <section className="space-y-3 rounded-[1.5rem] border border-white/10 bg-black/30 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.34)]">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-lime-300">{headerLabel}</p>
        <p className="mt-1 text-sm font-semibold text-gray-300">{subtitle}</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-black/50">
        <div className="relative w-full pt-[56.25%]">
          <iframe
            src={embedUrl}
            title={title}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-black text-white">{title}</p>
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-purple-300">
          {WORLD_CUP_VIDEO_CATEGORY_LABELS[category]}
          {sourceLabel ? ` · ${sourceLabel}` : ""}
        </p>
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex text-xs font-semibold text-lime-300 underline-offset-2 hover:underline"
        >
          Watch on YouTube
        </a>
      </div>
    </section>
  );
}
