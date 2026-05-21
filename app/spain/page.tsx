import Link from "next/link";
import { LocktLogo } from "@/components/LocktLogo";

export default function SpainSplashPage() {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#02040a] text-white">
      <div className="landing-shell py-8 sm:py-10">
        <header className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 rounded-3xl border border-white/10 bg-black/35 px-4 py-3">
          <div className="flex items-center gap-3">
            <LocktLogo size={48} />
            <div>
              <p className="brand-lockup text-3xl leading-none">
                <span className="bg-gradient-to-r from-lime-300 via-white to-purple-400 bg-clip-text text-transparent">LOCKT</span>
              </p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-lime-300/75">World Cup 2026</p>
            </div>
          </div>
          <Link
            href="/app"
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] px-3 text-[11px] font-black uppercase tracking-[0.12em] text-white transition hover:border-purple-300/45"
          >
            Match Hub
          </Link>
        </header>

        <section className="mx-auto mt-6 w-full max-w-4xl rounded-[2rem] border border-white/10 bg-black/40 p-5 sm:p-7">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-lime-300">Featured Storyline</p>
          <h1 className="sports-display mt-3 text-5xl italic leading-[0.9] sm:text-7xl">SPAIN FOCUS</h1>
          <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-gray-300 sm:text-base">
            Can Spain control the tournament tempo? Watch the breakdown, follow the story, and lock your call before kickoff.
          </p>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
            <div className="relative w-full pt-[56.25%]">
              <iframe
                src="https://www.youtube.com/embed/yUSWmgt0Uzo"
                title="Spain national team storyline"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Link
              href="/storylines/spain-can-they-control-the-tournament-tempo"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-lime-300/55 bg-lime-400/10 px-4 text-xs font-black uppercase tracking-[0.12em] text-lime-200 transition hover:bg-lime-400/20"
            >
              Open Storyline
            </Link>
            <Link
              href="/schedule"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-purple-300/45 bg-purple-500/10 px-4 text-xs font-black uppercase tracking-[0.12em] text-purple-100 transition hover:bg-purple-500/20"
            >
              View Schedule
            </Link>
            <Link
              href="/app"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 bg-white/[0.03] px-4 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:border-white/30"
            >
              Back to Match Hub
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
