export function PhonePreview() {
  return (
    <div className="mx-auto w-full max-w-[23rem] md:mr-0">
      <div className="relative rounded-[2.6rem] border border-white/15 bg-gradient-to-b from-slate-800 to-black p-3 shadow-[0_34px_90px_rgba(0,0,0,0.72),0_0_70px_rgba(139,92,246,0.22)]">
        <div className="absolute left-1/2 top-3 h-1.5 w-20 -translate-x-1/2 rounded-full bg-white/20" />
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#050814] p-4">
          <div className="flex items-center justify-between">
            <p className="sports-display text-2xl leading-none">Live Arena</p>
            <span className="rounded-full border border-red-300/20 bg-red-500/15 px-3 py-1 text-[10px] font-black uppercase text-red-200">
              Live
            </span>
          </div>

          <div className="arena-scoreboard mt-5 rounded-3xl border border-white/10 p-4">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">
              <span>LAL</span>
              <span>4th QTR / 2:47</span>
              <span>GSW</span>
            </div>
            <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <p className="scoreboard-number text-6xl text-green-100">108</p>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-gray-500">
                VS
              </span>
              <p className="scoreboard-number text-right text-6xl text-purple-100">103</p>
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-white/10 bg-black/50 p-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="scoreboard-number text-4xl text-green-300">62%</p>
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">Riding</p>
              </div>
              <div className="text-right">
                <p className="scoreboard-number text-4xl text-purple-300">38%</p>
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-500">Fading</p>
              </div>
            </div>
            <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-white/10">
              <div className="w-[62%] bg-gradient-to-r from-green-400 to-teal-300" />
              <div className="flex-1 bg-gradient-to-r from-purple-700 to-indigo-600" />
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-purple-200">Trending Take</p>
            <p className="mt-2 text-xl font-black text-white">“Curry is choking.”</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="min-h-12 rounded-2xl bg-gradient-to-r from-green-400 to-teal-300 text-sm font-black text-black">
                Ride
              </button>
              <button className="min-h-12 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 text-sm font-black text-white">
                Fade
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-3xl border border-yellow-300/20 bg-yellow-300/10 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-yellow-100">Chaos Alert</p>
            <p className="mt-2 text-sm font-bold leading-5 text-white">97% rode Lakers. Public collapse incoming.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
