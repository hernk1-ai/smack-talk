import Link from "next/link";
import { PhonePreview } from "@/components/landing/PhonePreview";

export function HeroSection() {
  return (
    <section id="about" className="relative overflow-hidden border-b border-white/10">
      <div className="landing-shell grid min-h-[calc(100dvh-4.5rem)] items-start gap-6 py-6 sm:py-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(22rem,0.7fr)] lg:gap-14 lg:pb-14 lg:pt-10">
        <div className="hero-copy relative mx-auto w-full max-w-4xl text-center lg:mx-0 lg:text-left">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300 sm:text-xs">World Cup 2026</p>

          <h1 className="hero-title sports-display mt-4 text-[clamp(2.6rem,12vw,6.8rem)] leading-[0.86] tracking-[0.01em] text-white sm:text-[7rem] lg:text-[6.8rem] xl:text-[8rem]">
            <span className="block">JOIN US FOR</span>
            <span className="hero-receipts block bg-gradient-to-r from-lime-300 via-white to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(132,204,22,0.18)]">WORLD CUP 2026.</span>
          </h1>

          <p className="mt-5 text-lg font-black uppercase tracking-[0.08em] text-white/95 sm:text-xl">Lock Takes. Show Receipts.</p>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-gray-300 sm:text-base">
            Make your World Cup calls, collect trophies, follow other fans, and check the receipts after every match.
          </p>
          <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-gray-400">13+ · No betting · No odds · No cash prizes</p>

          <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/signup"
              className="neon-cta inline-flex min-h-14 items-center justify-center rounded-sm px-8 text-base font-black uppercase italic tracking-[0.12em] text-black shadow-[0_0_34px_rgba(132,204,22,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_0_38px_rgba(132,204,22,0.3)] active:translate-y-0 active:scale-[0.99]"
            >
              Make First Call
              <span className="ml-4 text-xl leading-none">›</span>
            </Link>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[20.5rem] pb-2 sm:max-w-[20rem] lg:hidden">
          <div className="origin-top scale-[0.9] sm:scale-[0.88]">
            <PhonePreview />
          </div>
        </div>

        <div className="hidden justify-self-end lg:block lg:scale-[0.9] xl:scale-[0.96]">
          <PhonePreview />
        </div>
      </div>
    </section>
  );
}
