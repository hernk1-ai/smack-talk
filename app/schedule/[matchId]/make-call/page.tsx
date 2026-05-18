import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MakeCallPage } from "@/components/world-cup/MakeCallPage";
import { getWorldCupMatchById, getWorldCupMatchId } from "@/data/worldCupSchedule";
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

  const url = `${BASE_URL}/schedule/${encodeURIComponent(matchId)}/make-call`;
  return {
    title: `MAKE YOUR CALL | ${match.homeTeam} vs ${match.awayTeam ?? "TBD"} | LOCKT`,
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

  const supabase = await createClient();
  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: pick } = await supabase
    .from("match_picks")
    .select("*")
    .eq("user_id", user.id)
    .eq("match_id", getWorldCupMatchId(match))
    .maybeSingle();

  const { profile } = await ensureProfile(supabase, user);

  return <MakeCallPage match={match} initialPick={pick as MatchPick | null} profile={profile} />;
}
