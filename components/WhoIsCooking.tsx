import { whoIsCookingUsers } from "@/utils/arenaChat";

export function WhoIsCooking() {
  return (
    <section className="rounded-3xl border border-orange-400/20 bg-gradient-to-br from-orange-500/12 to-slate-950 p-4 shadow-[0_18px_44px_rgba(0,0,0,0.28)]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="sports-display text-2xl leading-none">🔥 Who&apos;s Cooking</h3>
        <span className="rounded-full border border-orange-300/20 bg-black/40 px-2 py-1 text-[10px] font-black uppercase text-orange-200">
          Arena
        </span>
      </div>

      <div className="space-y-2">
        {whoIsCookingUsers.map((user) => (
          <div
            key={user.handle}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-black/40 p-3"
          >
            <span className="scoreboard-number flex h-8 w-8 items-center justify-center rounded-full bg-white text-base text-black">
              {user.rank}
            </span>
            <div>
              <p className="text-sm font-black">{user.handle}</p>
              <p className="text-xs text-gray-400">cooking right now</p>
            </div>
            <p className="text-sm font-black text-orange-200">
              +{user.points} {user.icon}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
