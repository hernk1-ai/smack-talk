import type { Metadata } from "next";

import { LocktApp } from "@/components/LocktApp";
import type { ReceiptOwner } from "@/components/screens/ReceiptsScreen";
import { getSeededProfileByUsername } from "@/data/seededCrowd";
import { getSiteUrl } from "@/lib/site-url";
import { ensureProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

const BASE_URL = getSiteUrl();

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const key = decodeURIComponent(username).replace(/^@/, "");
  const handle = `@${key}`;
  const title = `${handle}'s LOCKT Receipts`;
  const description = "LOCKT is a sports reputation platform where fans lock takes, ride or fade calls, and build receipts.";
  const url = `${BASE_URL}/receipts/${encodeURIComponent(key.toLowerCase())}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "LOCKT",
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function PublicReceiptsPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();
  let profile = null;
  const key = decodeURIComponent(username).replace(/^@/, "").toLowerCase();
  let publicProfileOwner: ReceiptOwner | null = null;

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const result = await ensureProfile(supabase, user);
      profile = result.profile;
    }

    const { data: viewedProfile } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, reputation_score, reputation, favorite_teams")
      .ilike("username", key)
      .maybeSingle();

    if (viewedProfile) {
      publicProfileOwner = {
        userId: viewedProfile.id,
        username: viewedProfile.username || toDisplayUsername(key),
        avatarUrl: viewedProfile.avatar_url,
        reputation: viewedProfile.reputation_score ?? viewedProfile.reputation ?? 0,
        favoriteTeams: viewedProfile.favorite_teams ?? ["USA", "MEX", "ARG"],
      };
    }
  }

  const seededProfile = getSeededProfileByUsername(key);
  const seededOwner: ReceiptOwner | null = seededProfile
    ? {
        username: seededProfile.username,
        avatarUrl: null,
        reputation: seededProfile.reputation_score,
        favoriteTeams: seededProfile.favoriteTeams,
      }
    : null;
  const recordOwner = publicProfileOwner ?? seededOwner ?? {
    username: toDisplayUsername(key),
    avatarUrl: null,
    reputation: 4200,
    favoriteTeams: ["USA", "MEX", "ARG"],
  };

  return <LocktApp profile={profile} receiptOwner={recordOwner} initialView="receipts" />;
}

function toDisplayUsername(value: string) {
  return (
    value
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("") || "Talker"
  );
}
