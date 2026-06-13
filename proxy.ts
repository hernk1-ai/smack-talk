import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { isLegacyOnboardingPath, LEGACY_ONBOARDING_REDIRECT } from "@/lib/routing/legacyOnboarding";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";
import { getPostLoginRedirect } from "@/lib/supabase/profiles";

const protectedRoutes = ["/receipts", "/top-talkers", "/profile", "/settings", "/followers", "/following"];
const authRoutes = ["/login", "/signup", "/forgot-password", "/verify-email"];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isLegacyOnboardingPath(pathname)) {
    return redirectTo(request, LEGACY_ONBOARDING_REDIRECT);
  }

  const isDevelopment = process.env.NODE_ENV === "development";

  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response = NextResponse.next({ request });
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtectedRoute = protectedRoutes.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isAuthRoute = authRoutes.includes(pathname);

  if (isDevelopment && isAuthRoute) {
    return response;
  }

  if (!user && isProtectedRoute) {
    return redirectTo(request, "/login");
  }

  if (!user) {
    return response;
  }

  if (isAuthRoute) {
    return redirectTo(request, getPostLoginRedirect(null));
  }

  return response;
}

function redirectTo(request: NextRequest, path: string) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = path;
  redirectUrl.search = "";
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|google[^/]*\\.html|smack-talk-logo.png|smack-talk-logo.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
