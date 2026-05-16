import type { Metadata } from "next";

import { TakeThreadScreen } from "@/components/screens/TakeThreadScreen";
import { ensureProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://smacktalk.app";

export async function generateMetadata({ params }: { params: Promise<{ takeId: string }> }): Promise<Metadata> {
  const { takeId } = await params;
  const shortId = takeId.slice(0, 8);
  const title = `Smack Talk Take ${shortId}`;
  const description = "Public takes. Permanent receipts. The Arena remembers.";
  const url = `${BASE_URL}/take/${encodeURIComponent(takeId)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "article",
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
