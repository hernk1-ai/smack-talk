import type { Metadata } from "next";

import { ReceiptDetailScreen } from "@/components/screens/ReceiptDetailScreen";
import { ensureProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://smacktalk.app";

export async function generateMetadata({ params }: { params: Promise<{ receiptId: string }> }): Promise<Metadata> {
  const { receiptId } = await params;
  const shortId = receiptId.slice(0, 8);
  const title = `Smack Talk Receipt ${shortId}`;
  const description = "Public takes. Permanent receipts. The Arena remembers.";
  const url = `${BASE_URL}/receipt/${encodeURIComponent(receiptId)}`;

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
