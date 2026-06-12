import Link from "next/link";

export function HeroSection() {
  return (
    <section id="about" className="relative overflow-hidden border-b border-white/10">
      <div className="landing-shell grid items-start gap-6 py-8 sm:py-10 lg:pb-12 lg:pt-10">
        <div className="hero-copy relative mx-auto w-full max-w-4xl text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300 sm:text-xs">World Cup 2026</p>

          <h1 className="hero-title sports-display mt-4 text-[clamp(2.2rem,10vw,5.2rem)] leading-[0.92] tracking-[0.01em] text-white sm:text-[4.8rem] lg:text-[5rem]">
            Watch the World Cup with friends and family.
          </h1>

          <p className="mt-5 text-lg font-black uppercase tracking-[0.08em] text-white/95 sm:text-xl">Pick your team. Follow the score. React live.</p>
          <p className="mt-3 max-w-2xl mx-auto text-sm font-semibold leading-7 text-gray-300 sm:text-base">
            Lockt adds a game room to every match so friends and family can pick a winner, follow live scores, and chat together.
          </p>
          <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-gray-400">13+ · No betting · No odds · No cash prizes</p>

          <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
            <Link
              href="/app"
              className="neon-cta inline-flex min-h-14 items-center justify-center rounded-sm px-8 text-base font-black uppercase italic tracking-[0.12em] text-black shadow-[0_0_34px_rgba(132,204,22,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_0_38px_rgba(132,204,22,0.3)] active:translate-y-0 active:scale-[0.99]"
            >
              Go to Match Hub
              <span className="ml-4 text-xl leading-none">›</span>
            </Link>
            <Link
              href="/schedule"
              className="inline-flex min-h-14 items-center justify-center rounded-sm border border-white/20 bg-white/[0.03] px-8 text-base font-black uppercase italic tracking-[0.12em] text-white transition hover:-translate-y-0.5 hover:border-purple-300/40 hover:bg-purple-500/10"
            >
              View Schedule
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
