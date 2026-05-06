"use client";

export type AppView = "feed" | "arena" | "receipts" | "top-talkers" | "profile";

const navItems: { id: AppView; label: string; icon: string }[] = [
  { id: "feed", label: "Feed", icon: "▱" },
  { id: "arena", label: "Arena", icon: "◉" },
  { id: "receipts", label: "Receipts", icon: "▤" },
  { id: "top-talkers", label: "Top Talkers", icon: "♕" },
  { id: "profile", label: "Profile", icon: "♙" },
];

export function BottomNav({ activeView, onSelect }: { activeView: AppView; onSelect: (view: AppView) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[#02040a]/95 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-18px_50px_rgba(0,0,0,0.45)] backdrop-blur">
      <div className="bottom-nav-shell grid grid-cols-5 gap-1 rounded-[1.4rem] border border-white/10 bg-white/5 p-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`grid min-h-14 min-w-0 place-items-center gap-1 rounded-2xl px-1 py-2 text-center text-[9px] font-black uppercase leading-tight transition active:scale-95 sm:text-[10px] ${
              activeView === item.id ? "text-purple-300 shadow-[0_0_26px_rgba(139,92,246,0.22)]" : "text-gray-500"
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
