import { redirect } from "next/navigation";
import { getWorldCupMatchById, getWorldCupMatchId } from "@/data/worldCupSchedule";
import { getWorldCupMatchStatus } from "@/lib/worldCupMatchStatus";

export default async function MatchRoomRoute({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const match = getWorldCupMatchById(matchId);

  if (!match) {
    redirect("/schedule");
  }

  const lifecycle = getWorldCupMatchStatus(match);
  const roomGameId = getWorldCupMatchId(match);

  if (lifecycle === "upcoming") {
    redirect(`/schedule/${match.id}/make-call`);
  }

  redirect(`/game/${roomGameId}`);
}
