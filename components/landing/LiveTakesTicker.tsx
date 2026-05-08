const liveTakes = [
  { handle: "@RivalryKing", take: "Celtics in 6.", heat: "2.3K" },
  { handle: "@StatsAssassin", take: "SGA MVP.", heat: "1.8K" },
  { handle: "@FadeEmAll", take: "Cowboys overrated.", heat: "3.1K" },
];

export function LiveTakesTicker() {
  const tickerItems = [...liveTakes, ...liveTakes];

  return (
    <section id="arena" className="border-y border-white/10 bg-black/45">
      <div className="flex min-h-16 items-center overflow-hidden">
        <div className="flex shrink-0 items-center border-r border-white/10 px-5 sm:px-8">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-white">Live Takes</p>
          <span className="ml-3 h-2 w-2 rounded-full bg-red-500 shadow-[0_0_14px_rgba(239,68,68,0.85)]" />
        </div>

        <div className="ticker-track flex min-w-max items-center gap-10 px-6">
          {tickerItems.map((item, index) => (
            <div key={`${item.handle}-${index}`} className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.08em]">
              <span className="text-lime-300">{item.handle}:</span>
              <span className="text-gray-100">{item.take}</span>
              <span className="text-lime-300">↑ {item.heat}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
