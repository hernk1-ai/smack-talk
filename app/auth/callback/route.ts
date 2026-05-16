import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const nextParam = requestUrl.searchParams.get("next");
  const type = requestUrl.searchParams.get("type");
  const next = nextParam || (type === "recovery" ? "/reset-password" : "/app");

  if (code || (tokenHash && type)) {
    const supabase = await createClient();

    if (code) {
      await supabase?.auth.exchangeCodeForSession(code);
    } else if (tokenHash && type) {
      await supabase?.auth.verifyOtp({ token_hash: tokenHash, type: type as "email" | "recovery" | "invite" | "email_change" });
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
