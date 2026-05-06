import { whoIsCookingUsers } from "@/utils/arenaChat";

export function WhoIsCooking() {
  return (
    <section className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-black">🔥 Who&apos;s Cooking</h3>
        <span className="rounded-full bg-black/40 px-2 py-1 text-[10px] font-black uppercase text-orange-200">
          Arena
        </span>
      </div>

      <div className="space-y-2">
        {whoIsCookingUsers.map((user) => (
          <div key={user.handle} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl bg-black/30 p-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-black text-black">
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
