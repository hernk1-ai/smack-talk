import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";
import { getPostLoginRedirect } from "@/lib/supabase/profiles";
import type { Profile } from "@/lib/supabase/types";

const protectedRoutes = ["/app", "/arena", "/receipts", "/top-talkers", "/profile", "/settings", "/followers", "/following"];
const onboardingRoutes = ["/username", "/onboarding/profile-pic", "/onboarding/teams", "/onboarding/enter-arena"];
const authRoutes = ["/login", "/signup", "/forgot-password", "/verify-email"];

export async function middleware(request: NextRequest) {
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

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isOnboardingRoute = onboardingRoutes.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isAuthRoute = authRoutes.includes(pathname);

  if (isDevelopment && isAuthRoute) {
    return response;
  }

  if (isDevelopment && isOnboardingRoute) {
    return response;
  }

  if (!user && (isProtectedRoute || isOnboardingRoute)) {
    return redirectTo(request, "/login");
  }

  if (!user) {
    return response;
  }

  const profile = await getProfileForMiddleware(supabase, user.id);
  const onboardingDestination = getPostLoginRedirect(profile);

  if (isAuthRoute) {
    return redirectTo(request, onboardingDestination);
  }

  if (isProtectedRoute && onboardingDestination !== "/app") {
    return redirectTo(request, onboardingDestination);
  }

  if (isOnboardingRoute) {
    if (onboardingDestination === "/app") {
      return redirectTo(request, "/app");
    }

    if (!profile?.username && pathname !== "/username") {
      return redirectTo(request, "/username");
    }
  }

  return response;
}

async function getProfileForMiddleware(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
): Promise<Profile | null> {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data;
}

function redirectTo(request: NextRequest, path: string) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = path;
  redirectUrl.search = "";
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|smack-talk-logo.png|smack-talk-logo.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
