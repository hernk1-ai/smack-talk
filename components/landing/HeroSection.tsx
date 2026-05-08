export function HeroSection() {
  return (
    <section id="about" className="relative overflow-hidden border-b border-white/10">
      <div className="landing-shell grid min-h-[calc(100dvh-4.5rem)] items-center gap-10 py-10 sm:py-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(22rem,0.7fr)] lg:gap-14">
        <div className="hero-copy relative max-w-4xl">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300 sm:text-xs">
            The live social sports arena
          </p>

          <h1 className="hero-title sports-display mt-4 text-[clamp(3rem,13vw,7.4rem)] leading-[0.83] tracking-[0.01em] text-white sm:text-[8rem] lg:text-[7.2rem] xl:text-[8.7rem]">
            <span className="block whitespace-nowrap">Talk Smack.</span>
            <span className="hero-receipts block whitespace-nowrap bg-gradient-to-r from-lime-300 via-white to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(132,204,22,0.18)]">
              Show Receipts.
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-xl font-black uppercase leading-tight tracking-[0.12em] text-gray-200 sm:text-2xl">
            Lock your takes.
            <span className="block sm:inline"> Build your reputation.</span>
          </p>

          <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
            <a
              href="#waitlist"
              className="neon-cta inline-flex min-h-14 items-center justify-center rounded-sm px-8 text-base font-black uppercase italic tracking-[0.12em] text-black shadow-[0_0_34px_rgba(132,204,22,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_0_38px_rgba(132,204,22,0.3)] active:translate-y-0 active:scale-[0.99]"
            >
              Claim Your Spot
              <span className="ml-4 text-xl leading-none">›</span>
            </a>
            <p className="text-sm font-semibold text-gray-300">Join the first wave of competitors.</p>
          </div>
        </div>

        <div className="hero-culture-card relative hidden min-h-[29rem] overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-5 shadow-[0_34px_100px_rgba(0,0,0,0.54)] lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_54%_22%,rgba(245,158,11,0.2),transparent_13rem),radial-gradient(circle_at_82%_58%,rgba(168,85,247,0.2),transparent_15rem)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/70 to-transparent" />

          <div className="relative ml-auto w-44 rounded-2xl border border-lime-300/25 bg-black/55 p-4 text-right shadow-[0_0_30px_rgba(132,204,22,0.1)]">
            <p className="text-lg font-black uppercase leading-tight tracking-[0.08em] text-lime-300">Takes Don’t Lie.</p>
            <p className="mt-3 text-lg font-black uppercase leading-tight tracking-[0.08em] text-purple-300">
              Receipts Don’t Lie.
            </p>
          </div>

          <div className="relative mt-24 max-w-xs">
            <p className="sports-display text-5xl leading-none text-white/80">I called it.</p>
            <p className="mt-2 text-3xl font-black uppercase italic tracking-[0.04em] text-lime-300">Prove me wrong.</p>
          </div>

          <div className="absolute bottom-8 left-6 right-6 grid grid-cols-3 gap-3">
            {["BOS", "OKC", "DAL"].map((team) => (
              <div key={team} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center">
                <p className="scoreboard-number text-2xl text-white">{team}</p>
                <p className="mt-1 text-[9px] font-black uppercase tracking-[0.12em] text-gray-500">live</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
