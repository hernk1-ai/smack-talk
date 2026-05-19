import { NextResponse, type NextRequest } from "next/server";

import { getSiteUrl } from "@/lib/site-url";
import { getPostLoginRedirect } from "@/lib/supabase/profiles";
import { ensureProfile } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const nextParam = requestUrl.searchParams.get("next");
  const type = requestUrl.searchParams.get("type");
  const source = requestUrl.searchParams.get("source");
  const fallbackNext = type === "recovery" ? "/reset-password" : "/app";
  const explicitNext = nextParam && nextParam.startsWith("/") ? nextParam : null;
  let next = explicitNext ?? fallbackNext;
  const isOAuth = source === "oauth";

  if (code || (tokenHash && type)) {
    const supabase = await createClient();

    if (code) {
      await supabase?.auth.exchangeCodeForSession(code);
    } else if (tokenHash && type) {
      await supabase?.auth.verifyOtp({ token_hash: tokenHash, type: type as "email" | "recovery" | "invite" | "email_change" });
    }

    if (isOAuth && supabase && !explicitNext) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { profile } = await ensureProfile(supabase, user);
        next = getPostLoginRedirect(profile ?? null);
      }
    }
  }

  return NextResponse.redirect(new URL(next, getSiteUrl()));
}
