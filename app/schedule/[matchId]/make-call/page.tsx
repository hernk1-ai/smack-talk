import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MakeCallPage } from "@/components/world-cup/MakeCallPage";
import { getWorldCupMatchById, getWorldCupMatchId } from "@/data/worldCupSchedule";
import { fetchResolvedMatchContext } from "@/lib/worldCup/fetchResolvedMatchContext";
import { resolveMatch } from "@/lib/worldCup/resolvedMatch";
import { getSiteUrl } from "@/lib/site-url";
import { ensureProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";
import type { MatchPick } from "@/lib/supabase/types";

const BASE_URL = getSiteUrl();

export async function generateMetadata({ params }: { params: Promise<{ matchId: string }> }): Promise<Metadata> {
  const { matchId } = await params;
  const match = getWorldCupMatchById(matchId);

  if (!match) {
    return {
      title: "MAKE YOUR CALL | LOCKT",
      description: "LOCKT is a sports reputation platform where fans lock takes, ride or fade calls, and build receipts.",
    };
  }

  const resolvedContext = await fetchResolvedMatchContext();
  const resolved = resolveMatch(match, resolvedContext);

  const url = `${BASE_URL}/schedule/${encodeURIComponent(matchId)}/make-call`;
  return {
    title: `MAKE YOUR CALL | ${resolved.title} | LOCKT`,
    description: "Lock your match pick before kickoff.",
    alternates: {
      canonical: url,
    },
  };
}

export default async function MatchMakeCallPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const match = getWorldCupMatchById(matchId);
  if (!match) {
    redirect("/schedule");
  }

  const resolvedContext = await fetchResolvedMatchContext();
  const resolved = resolveMatch(match, resolvedContext);

  const supabase = await createClient();
  if (!supabase) {
    return <MakeCallPage match={match} resolvedMatch={resolved} initialPick={null} profile={null} isAuthenticated={false} />;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <MakeCallPage match={match} resolvedMatch={resolved} initialPick={null} profile={null} isAuthenticated={false} />;
  }

  const { data: pick } = await supabase
    .from("match_picks")
    .select("*")
    .eq("user_id", user.id)
    .eq("match_id", getWorldCupMatchId(match))
    .maybeSingle();

  const { profile } = await ensureProfile(supabase, user);

  return (
    <MakeCallPage
      match={match}
      resolvedMatch={resolved}
      initialPick={pick as MatchPick | null}
      profile={profile}
      isAuthenticated
    />
  );
}
