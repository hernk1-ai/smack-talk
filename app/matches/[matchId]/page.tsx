import { redirect } from "next/navigation";
import { getWorldCupMatchById, getWorldCupMatchId } from "@/data/worldCupSchedule";

export default async function MatchRoomRoute({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const match = getWorldCupMatchById(matchId);

  if (!match) {
    redirect("/schedule");
  }

  redirect(`/game/${getWorldCupMatchId(match)}`);
}
