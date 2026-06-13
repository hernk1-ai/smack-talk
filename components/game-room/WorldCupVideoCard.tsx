import { CompanionVideoCard } from "@/components/world-cup/CompanionVideoCard";
import { WORLD_CUP_TV_SUBTITLES, type WorldCupMatchPhase } from "@/lib/worldCup/matchPhase";
import type { WorldCupVideoCategory } from "@/lib/worldCup/worldCupVideos";

type WorldCupVideoCardProps = {
  title: string;
  sourceLabel?: string | null;
  youtubeId: string;
  category: WorldCupVideoCategory;
  matchPhase?: WorldCupMatchPhase;
};

export function WorldCupVideoCard({ title, sourceLabel, youtubeId, category, matchPhase }: WorldCupVideoCardProps) {
  return (
    <CompanionVideoCard
      headerLabel="World Cup TV"
      subtitle={WORLD_CUP_TV_SUBTITLES[matchPhase ?? "any"]}
      title={title}
      sourceLabel={sourceLabel}
      youtubeId={youtubeId}
      category={category}
    />
  );
}
