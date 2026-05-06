const arenaStats = [
  { label: "Riding LAL", value: "78%", tone: "text-green-300", bar: "w-[78%] bg-green-400" },
  { label: "Fading GSW", value: "22%", tone: "text-indigo-200", bar: "w-[22%] bg-purple-600" },
  { label: "On the Fence", value: "0%", tone: "text-gray-400", bar: "w-[3%] bg-gray-500" },
];

const arenaMoves = [
  {
    handle: "FadeKing",
    time: "just now",
    action: "Faded GSW",
    heat: "🔥 12",
  },
  {
    handle: "StreakGod",
    time: "2m ago",
    action: "On a 6 game streak",
    heat: "⚡ live",
  },
];

export function RunTheArena({ onFadePublic }: { onFadePublic: () => void }) {
  return (
    <aside className="premium-card rounded-3xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-200">Control room</p>
          <h3 className="sports-display mt-1 text-2xl leading-none">Run the Arena</h3>
        </div>
        <span className="rounded-full border border-green-300/20 bg-green-400/10 px-2 py-1 text-[10px] font-black uppercase text-green-200">
          live
        </span>
      </div>

      <div className="mt-4 grid gap-2">
        {arenaStats.map((stat) => (
          <div key={stat.label} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl bg-black/25 p-2">
            <div>
              <span className={`text-[10px] font-black uppercase ${stat.tone}`}>{stat.label}</span>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div className={`h-full rounded-full ${stat.bar}`} />
              </div>
            </div>
            <strong className="text-xs font-black text-gray-200">{stat.value}</strong>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {arenaMoves.map((move) => (
          <article key={move.handle} className="rounded-2xl border border-white/10 bg-black/35 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-purple-300 to-sky-300 text-xs font-black text-black">
                  {move.handle.slice(0, 2).toUpperCase()}
                </span>
                <p className="text-sm font-black">{move.handle}</p>
              </div>
              <span className="text-[10px] font-black uppercase text-gray-500">{move.time}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs font-bold text-gray-300">{move.action}</p>
              <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-black text-gray-200">
                {move.heat}
              </span>
            </div>
          </article>
        ))}
      </div>

      <button
        onClick={onFadePublic}
        className="mt-4 w-full rounded-2xl border border-purple-400/30 bg-purple-500/10 px-3 py-3 text-left transition active:scale-95"
        type="button"
      >
        <p className="text-sm font-black uppercase text-purple-100">😈 Fade the public. Prove it.</p>
        <p className="mt-1 text-xs font-bold text-gray-400">Talk is easy. Receipts are real.</p>
      </button>
    </aside>
  );
}
