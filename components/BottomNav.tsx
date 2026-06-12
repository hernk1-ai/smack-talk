"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SHOW_GAME_ROOM_IN_NAV,
  SHOW_MATCH_HUB,
  SHOW_PROFILES,
  SHOW_SCHEDULE,
} from "@/lib/productConfig";
import { SCHEDULE_FALLBACK_ROUTE } from "@/lib/worldCupMatchResolver";
import { resolveGameRoomNavHrefClient } from "@/lib/worldCupNavClient";

export type AppView = "arena" | "live-arena" | "receipts" | "top-talkers" | "profile" | "schedule";
type PrimaryNavView = "match-hub" | "schedule" | "game-room" | "profile";
type NavView = PrimaryNavView | "arena" | "receipts" | "settings";

const navItems: { id: PrimaryNavView; label: string; icon: string }[] = [
  { id: "match-hub", label: "Match Hub", icon: "◉" },
  { id: "schedule", label: "Schedule", icon: "◷" },
  { id: "game-room", label: "Game Room", icon: "▦" },
  { id: "profile", label: "Profile", icon: "▤" },
];

function getPublicNavItems() {
  return navItems.filter((item) => {
    if (item.id === "match-hub") return SHOW_MATCH_HUB;
    if (item.id === "schedule") return SHOW_SCHEDULE;
    if (item.id === "game-room") return SHOW_GAME_ROOM_IN_NAV;
    if (item.id === "profile") return SHOW_PROFILES;
    return true;
  });
}

function toPrimaryNav(view: NavView | AppView): PrimaryNavView {
  if (view === "live-arena" || view === "game-room") return "game-room";
  if (view === "receipts" || view === "profile" || view === "settings") return SHOW_PROFILES ? "profile" : "match-hub";
  if (view === "arena") return "match-hub";
  return "schedule";
}

export function BottomNav({ activeView, onSelect }: { activeView: AppView; onSelect: (view: PrimaryNavView) => void }) {
  const activeNavView = toPrimaryNav(activeView);
  const items = getPublicNavItems();
  const columnClass = items.length === 2 ? "grid-cols-2" : items.length === 3 ? "grid-cols-3" : "grid-cols-4";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[#0b0f0c]/95 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-18px_50px_rgba(0,0,0,0.45)] backdrop-blur">
      <div className={`bottom-nav-shell grid ${columnClass} gap-1 rounded-[1.4rem] border border-white/10 bg-white/5 p-2`}>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`grid min-h-14 min-w-0 place-items-center gap-1 rounded-2xl px-1 py-2 text-center text-[9px] font-black uppercase leading-tight transition active:scale-95 sm:text-[10px] ${
              activeNavView === item.id ? "text-purple-300 shadow-[0_0_26px_rgba(139,92,246,0.22)]" : "text-gray-500"
            }`}
            type="button"
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className="max-w-full truncate">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

const routeByView: Record<NavView, string> = {
  "match-hub": "/app",
  schedule: "/schedule",
  // Resolved dynamically (live → next → schedule) in RouteBottomNav; this is the safe default.
  "game-room": SCHEDULE_FALLBACK_ROUTE,
  profile: "/receipts",
  arena: "/app",
  receipts: "/receipts",
  settings: "/settings",
};

export function RouteBottomNav({ activeView }: { activeView: NavView }) {
  const router = useRouter();
  const activePrimary = toPrimaryNav(activeView);
  const items = getPublicNavItems();
  const columnClass = items.length === 2 ? "grid-cols-2" : items.length === 3 ? "grid-cols-3" : "grid-cols-4";

  const itemClass = (id: PrimaryNavView) =>
    `grid min-h-14 min-w-0 place-items-center gap-1 rounded-2xl px-1 py-2 text-center text-[9px] font-black uppercase leading-tight transition active:scale-95 sm:text-[10px] ${
      activePrimary === id ? "text-purple-300 shadow-[0_0_26px_rgba(139,92,246,0.22)]" : "text-gray-500"
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[#0b0f0c]/95 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-18px_50px_rgba(0,0,0,0.45)] backdrop-blur">
      <div className={`bottom-nav-shell grid ${columnClass} gap-1 rounded-[1.4rem] border border-white/10 bg-white/5 p-2`}>
        {items.map((item) =>
          // Game Room resolves to the live/next match at click time (always current,
          // and avoids SSR/CSR clock drift). Other items use stable static routes.
          item.id === "game-room" ? (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                void resolveGameRoomNavHrefClient().then((href) => router.push(href));
              }}
              className={itemClass(item.id)}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="max-w-full truncate">{item.label}</span>
            </button>
          ) : (
            <Link key={item.id} href={routeByView[item.id]} className={itemClass(item.id)}>
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          ),
        )}
      </div>
    </nav>
  );
}
