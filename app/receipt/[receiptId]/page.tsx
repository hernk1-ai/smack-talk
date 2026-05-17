import type { Metadata } from "next";

import { ReceiptDetailScreen } from "@/components/screens/ReceiptDetailScreen";
import { getSiteUrl } from "@/lib/site-url";
import { ensureProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

const BASE_URL = getSiteUrl();

export async function generateMetadata({ params }: { params: Promise<{ receiptId: string }> }): Promise<Metadata> {
  const { receiptId } = await params;
  const shortId = receiptId.slice(0, 8);
  const title = `LOCKT Receipt ${shortId}`;
  const description = "LOCKT is a sports reputation platform where fans lock takes, ride or fade calls, and build receipts.";
  const url = `${BASE_URL}/receipt/${encodeURIComponent(receiptId)}`;

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

export default async function ReceiptPage({ params }: { params: Promise<{ receiptId: string }> }) {
  const { receiptId } = await params;
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

  return <ReceiptDetailScreen receiptId={receiptId} profile={profile} />;
}
