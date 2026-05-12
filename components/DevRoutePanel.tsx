"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const devRoutes = [
  {
    href: "/",
    label: "Landing Page",
    file: "app/page.tsx",
  },
  {
    href: "/terms",
    label: "Terms",
    file: "app/terms/page.tsx",
  },
  {
    href: "/privacy",
    label: "Privacy",
    file: "app/privacy/page.tsx",
  },
  {
    href: "/signup",
    label: "Create Account",
    file: "app/signup/page.tsx",
  },
  {
    href: "/login",
    label: "Login",
    file: "app/login/page.tsx",
  },
  {
    href: "/verify-email",
    label: "Verify Email",
    file: "app/verify-email/page.tsx",
  },
  {
    href: "/forgot-password",
    label: "Forgot Password",
    file: "app/forgot-password/page.tsx",
  },
  {
    href: "/reset-email-sent",
    label: "Reset Email Sent",
    file: "app/reset-email-sent/page.tsx",
  },
  {
    href: "/reset-password",
    label: "Reset Password",
    file: "app/reset-password/page.tsx",
  },
  {
    href: "/password-reset-email-preview",
    label: "Reset Email Preview",
    file: "app/password-reset-email-preview/page.tsx",
  },
  {
    href: "/username",
    label: "Username",
    file: "app/username/page.tsx",
  },
  {
    href: "/onboarding/profile-pic",
    label: "Profile Pic",
    file: "app/onboarding/profile-pic/page.tsx",
  },
  {
    href: "/onboarding/teams",
    label: "Teams",
    file: "app/onboarding/teams/page.tsx",
  },
  {
    href: "/onboarding/enter-arena",
    label: "Enter Arena",
    file: "app/onboarding/enter-arena/page.tsx",
  },
  {
    href: "/app",
    label: "Smack Talk App",
    file: "app/app/page.tsx",
  },
];

export function DevRoutePanel() {
  const pathname = usePathname();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <nav
      aria-label="Developer route shortcuts"
      className="fixed bottom-3 left-3 z-[100] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-white/15 bg-black/80 p-3 text-white shadow-2xl backdrop-blur-md"
    >
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-lime-300">
        Dev Routes
      </p>
      <div className="flex max-h-[38vh] flex-wrap gap-2 overflow-y-auto pr-1">
        {devRoutes.map((route) => {
          const isActive = pathname === route.href;

          return (
            <Link
              key={route.href}
              href={route.href}
              className={`rounded-full border px-3 py-2 text-xs font-bold transition hover:border-lime-300/60 hover:bg-lime-300/15 hover:text-lime-200 ${
                isActive
                  ? "border-lime-300/70 bg-lime-300/20 text-lime-100 shadow-[0_0_18px_rgba(157,255,46,0.18)]"
                  : "border-white/10 bg-white/10"
              }`}
              title={route.file}
            >
              {route.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
