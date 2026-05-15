"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { settleGameForDev } from "@/lib/supabase/settlement";

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
  {
    href: "/game/lal-gsw-live",
    label: "Game Room",
    file: "app/game/[gameId]/page.tsx",
  },
];

export function DevRoutePanel() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [settlementStatus, setSettlementStatus] = useState("");
  const [settlementLoading, setSettlementLoading] = useState<"hit" | "miss" | null>(null);
  const [syncStatus, setSyncStatus] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  async function handleSettlement(result: "hit" | "miss") {
    setSettlementLoading(result);
    setSettlementStatus("");

    const { rows, error } = await settleGameForDev(result);

    setSettlementStatus(error ? error.message : `Settled ${rows.length} take${rows.length === 1 ? "" : "s"} as ${result}.`);
    setSettlementLoading(null);
  }

  async function handleSyncGames() {
    setIsSyncing(true);
    setSyncStatus("");

    try {
      const response = await fetch("/api/sync-games", {
        method: "POST",
      });
      const payload = (await response.json()) as { count?: number; error?: string };

      setSyncStatus(response.ok ? `Synced ${payload.count ?? 0} NBA game${payload.count === 1 ? "" : "s"}.` : payload.error ?? "Sync failed.");
    } catch (error) {
      setSyncStatus(error instanceof Error ? error.message : "Sync failed.");
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="fixed bottom-3 right-3 z-[100] flex max-w-[calc(100vw-1.5rem)] flex-col items-end gap-2 text-white">
      {isOpen && (
        <nav
          id="developer-route-shortcuts"
          aria-label="Developer route shortcuts"
          className="max-h-[42vh] w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-white/15 bg-black/85 p-3 shadow-2xl backdrop-blur-md"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-lime-300">
              Dev Routes
            </p>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-gray-300 transition hover:border-purple-300/50 hover:text-white"
              aria-label="Close developer routes"
            >
              Close
            </button>
          </div>
          <div className="flex max-h-[34vh] flex-wrap gap-2 overflow-y-auto pr-1">
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
          <div className="mt-3 border-t border-white/10 pt-3">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-lime-300">
              Live Data
            </p>
            <button
              type="button"
              onClick={handleSyncGames}
              disabled={isSyncing}
              className="w-full rounded-full border border-lime-300/35 bg-lime-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-lime-200 transition hover:bg-lime-400/20 disabled:cursor-wait disabled:opacity-60"
            >
              {isSyncing ? "Syncing..." : "Sync NBA Games"}
            </button>
            {syncStatus && <p className="mt-2 text-[10px] font-bold leading-4 text-gray-300">{syncStatus}</p>}
          </div>
          <div className="mt-3 border-t border-white/10 pt-3">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-purple-300">
              Dev Settlement
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSettlement("hit")}
                disabled={settlementLoading !== null}
                className="rounded-full border border-lime-300/35 bg-lime-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-lime-200 transition hover:bg-lime-400/20 disabled:cursor-wait disabled:opacity-60"
              >
                {settlementLoading === "hit" ? "Settling..." : "Settle Hit"}
              </button>
              <button
                type="button"
                onClick={() => handleSettlement("miss")}
                disabled={settlementLoading !== null}
                className="rounded-full border border-red-300/35 bg-red-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-red-200 transition hover:bg-red-500/20 disabled:cursor-wait disabled:opacity-60"
              >
                {settlementLoading === "miss" ? "Settling..." : "Settle Miss"}
              </button>
            </div>
            {settlementStatus && (
              <p className="mt-2 text-[10px] font-bold leading-4 text-gray-300">{settlementStatus}</p>
            )}
          </div>
        </nav>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="rounded-full border border-lime-300/35 bg-black/85 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-lime-200 shadow-2xl backdrop-blur-md transition hover:-translate-y-0.5 hover:border-purple-300/60 hover:text-white active:scale-95"
        aria-expanded={isOpen}
        aria-controls="developer-route-shortcuts"
      >
        Dev Routes
      </button>
    </div>
  );
}
