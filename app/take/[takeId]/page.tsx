import type { Metadata } from "next";

import { TakeThreadScreen } from "@/components/screens/TakeThreadScreen";
import { getSiteUrl } from "@/lib/site-url";
import { ensureProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

const BASE_URL = getSiteUrl();

export async function generateMetadata({ params }: { params: Promise<{ takeId: string }> }): Promise<Metadata> {
  const { takeId } = await params;
  const shortId = takeId.slice(0, 8);
  const title = `LOCKT Take ${shortId}`;
  const description = "LOCKT is a sports reputation platform where fans lock takes, ride or fade calls, and build receipts.";
  const url = `${BASE_URL}/take/${encodeURIComponent(takeId)}`;

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
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function TakePage({ params }: { params: Promise<{ takeId: string }> }) {
  const { takeId } = await params;
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

  return <TakeThreadScreen takeId={takeId} profile={profile} />;
}
