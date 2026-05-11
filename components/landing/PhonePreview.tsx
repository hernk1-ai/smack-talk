export function PhonePreview() {
  return (
    <div className="mx-auto w-full max-w-[22rem] md:mr-0 lg:max-w-[27rem]">
      <div className="phone-glow relative rounded-[2.7rem] border border-white/15 bg-gradient-to-b from-slate-700 to-black p-2.5 shadow-[0_34px_90px_rgba(0,0,0,0.72),0_0_76px_rgba(168,85,247,0.28)] md:rotate-[5deg] lg:p-3">
        <div className="absolute left-1/2 top-3 h-1.5 w-20 -translate-x-1/2 rounded-full bg-white/20" />
        <div className="overflow-hidden rounded-[2.05rem] border border-white/10 bg-[#050814] p-4 lg:p-5">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase italic tracking-[0.16em] text-red-300">
              <span className="h-2 w-2 rounded-full border border-red-400" /> Live Arena
            </p>
            <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white">12.8K Watching</span>
          </div>

          <div className="arena-scoreboard mt-5 rounded-3xl border border-white/10 px-3 py-4 shadow-inner sm:px-4">
            <div className="grid grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)] items-center gap-x-2 text-[10px] font-black uppercase tracking-[0.16em] text-gray-300 sm:grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1fr)] sm:gap-x-3">
              <span className="justify-self-center sm:justify-self-start">LAL</span>
              <span className="justify-self-center text-purple-300">4th QTR</span>
              <span className="justify-self-center sm:justify-self-end">GSW</span>
            </div>
            <div className="mt-3 grid grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)] items-end gap-x-2 sm:grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1fr)] sm:gap-x-3">
              <p className="scoreboard-number justify-self-center text-[2.85rem] text-white sm:justify-self-start sm:text-[3.35rem] lg:text-[4rem]">
                108
              </p>
              <span className="scoreboard-number justify-self-center pb-1 text-[1.75rem] text-gray-200 sm:text-[2.1rem] lg:text-[2.5rem]">
                2:47
              </span>
              <p className="scoreboard-number justify-self-center text-[2.85rem] text-white sm:justify-self-end sm:text-[3.35rem] lg:text-[4rem]">
                103
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-white/10 bg-black/55 p-4">
            <div className="flex items-end justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-lime-300">62% Riding</p>
              <span className="text-xl text-gray-300">⚡</span>
              <p className="text-right text-[10px] font-black uppercase tracking-[0.12em] text-purple-300">38% Fading</p>
            </div>
            <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-white/10 shadow-[0_0_18px_rgba(132,204,22,0.14)]">
              <div className="w-[62%] bg-gradient-to-r from-lime-400 to-lime-300" />
              <div className="w-4 bg-white/30" />
              <div className="flex-1 bg-gradient-to-r from-purple-700 to-indigo-600" />
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-purple-400/35 bg-purple-500/10 p-4 shadow-[0_0_26px_rgba(168,85,247,0.08)]">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-200">⚑ Trending Take</p>
            <p className="mt-2 text-xl font-black italic text-white">“Curry is choking.”</p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-lime-300 to-purple-400 text-xs font-black text-black">
                  T
                </span>
                <p className="truncate text-xs font-bold text-gray-200">@TalkHeavy23</p>
              </div>
              <p className="shrink-0 text-sm font-black text-lime-300">🔥 2.1K</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="min-h-12 rounded-xl border border-lime-300/60 bg-lime-400/10 text-sm font-black uppercase italic tracking-[0.1em] text-lime-300 shadow-[0_0_18px_rgba(132,204,22,0.12)]">
                Ride
              </button>
              <button className="min-h-12 rounded-xl border border-purple-300/50 bg-purple-500/10 text-sm font-black uppercase italic tracking-[0.1em] text-purple-200">
                Fade
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-3xl border border-red-400/30 bg-red-500/10 p-4 shadow-[0_0_26px_rgba(239,68,68,0.08)]">
            <div className="grid grid-cols-[auto_1fr] gap-3">
              <span className="text-4xl">💀</span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-300">Chaos Alert</p>
                <p className="mt-2 text-sm font-bold leading-5 text-white">97% rode Lakers.</p>
                <p className="mt-1 text-xs font-semibold text-gray-400">Crowd collapse incoming.</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/[0.04] px-3 py-2">
            <div className="flex -space-x-2">
              {["A", "B", "C", "D"].map((item) => (
                <span
                  key={item}
                  className="grid h-7 w-7 place-items-center rounded-full border border-black bg-gradient-to-br from-lime-300 to-purple-500 text-[10px] font-black text-black"
                >
                  {item}
                </span>
              ))}
            </div>
            <p className="text-xs font-bold text-gray-300">+8.2K others online</p>
          </div>
        </div>
      </div>
    </div>
  );
}
