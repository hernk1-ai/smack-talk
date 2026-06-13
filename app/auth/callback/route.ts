import { NextResponse, type NextRequest } from "next/server";

import { getSiteUrl } from "@/lib/site-url";
import { getSafeNextPath } from "@/lib/signup/signupCopy";
import { finalizeGuestClaimProfile, isGuestClaimPending } from "@/lib/supabase/guestClaim";
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
  const claim = requestUrl.searchParams.get("claim") === "1";
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

    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await ensureProfile(supabase, user);
        const isClaimFlow = claim || isGuestClaimPending(user);

        if (isClaimFlow) {
          if (isOAuth) {
            await finalizeGuestClaimProfile(supabase, user);
            next = getSafeNextPath(explicitNext ?? getPostLoginRedirect(null));
          } else if (user.email_confirmed_at) {
            await finalizeGuestClaimProfile(supabase, user);
            next = `/claim/password?next=${encodeURIComponent(getSafeNextPath(explicitNext ?? "/app"))}`;
          }
        } else if (isOAuth && !explicitNext) {
          const { profile } = await ensureProfile(supabase, user);
          next = getPostLoginRedirect(profile ?? null);
        }
      }
    }
  }

  return NextResponse.redirect(new URL(next, getSiteUrl()));
}
