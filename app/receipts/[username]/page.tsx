import { SmackTalkApp } from "@/components/SmackTalkApp";
import type { ReceiptOwner } from "@/components/screens/ReceiptsScreen";
import { ensureProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

const seededOwners: Record<string, ReceiptOwner> = {
  talkheavy23: { username: "TalkHeavy23", avatarUrl: null, reputation: 9250, favoriteTeams: ["LAL", "NYK", "DEN"] },
  midrange: { username: "MidRange", avatarUrl: null, reputation: 8100, favoriteTeams: ["NYK", "BOS", "DEN"] },
  bucketsonly: { username: "BucketsOnly", avatarUrl: null, reputation: 7800, favoriteTeams: ["LAL", "GSW", "MIA"] },
  hoopdreams: { username: "HoopDreams", avatarUrl: null, reputation: 6200, favoriteTeams: ["MIA", "ATL", "DAL"] },
  fadeking: { username: "FadeKing", avatarUrl: null, reputation: 6900, favoriteTeams: ["DEN", "BOS", "GSW"] },
  nomercy: { username: "NoMercy", avatarUrl: null, reputation: 5900, favoriteTeams: ["PHX", "NYK", "DAL"] },
  primetalker: { username: "PrimeTalker", avatarUrl: null, reputation: 5400, favoriteTeams: ["BOS", "LAL", "NYK"] },
  clutchcallz: { username: "ClutchCallz", avatarUrl: null, reputation: 5100, favoriteTeams: ["GSW", "DAL", "DEN"] },
  realdeal: { username: "RealDeal", avatarUrl: null, reputation: 4800, favoriteTeams: ["MIA", "BOS", "ATL"] },
  sharpmind: { username: "SharpMind", avatarUrl: null, reputation: 4600, favoriteTeams: ["DEN", "NYK", "GSW"] },
};

export default async function PublicReceiptsPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();
  let profile = null;

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const result = await ensureProfile(supabase, user);
      profile = result.profile;
    }
  }

  const key = decodeURIComponent(username).replace(/^@/, "").toLowerCase();
  const recordOwner = seededOwners[key] ?? {
    username: toDisplayUsername(key),
    avatarUrl: null,
    reputation: 4200,
    favoriteTeams: ["LAL", "NYK", "DEN"],
  };

  return <SmackTalkApp profile={profile} receiptOwner={recordOwner} initialView="receipts" />;
}

function toDisplayUsername(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("") || "Talker";
}
