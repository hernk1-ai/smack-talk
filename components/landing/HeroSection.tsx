import { PhonePreview } from "@/components/landing/PhonePreview";

export function HeroSection() {
  return (
    <section id="about" className="relative overflow-hidden border-b border-white/10">
      <div className="landing-shell grid min-h-[calc(100dvh-4.5rem)] items-start gap-8 py-6 sm:py-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(22rem,0.7fr)] lg:gap-14 lg:pb-14 lg:pt-10">
        <div className="hero-copy relative max-w-4xl">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300 sm:text-xs">World Cup-first reputation platform</p>

          <h1 className="hero-title sports-display mt-4 text-[clamp(3rem,13vw,7.4rem)] leading-[0.83] tracking-[0.01em] text-white sm:text-[8rem] lg:text-[7.2rem] xl:text-[8.7rem]">
            <span className="block whitespace-nowrap">LOCK YOUR WORLD CUP CALLS</span>
            <span className="hero-receipts block whitespace-nowrap bg-gradient-to-r from-lime-300 via-white to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(132,204,22,0.18)]">Check the receipt.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-xl font-black uppercase leading-tight tracking-[0.12em] text-gray-200 sm:text-2xl">
            Lock your pick.
            <span className="block sm:inline"> Build tournament reputation.</span>
          </p>
          <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-gray-300 sm:text-lg">
            Make your tournament picks, call the moments before they happen, and build a reputation with receipts.
          </p>

          <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
            <a
              href="#waitlist"
              className="neon-cta inline-flex min-h-14 items-center justify-center rounded-sm px-8 text-base font-black uppercase italic tracking-[0.12em] text-black shadow-[0_0_34px_rgba(132,204,22,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_0_38px_rgba(132,204,22,0.3)] active:translate-y-0 active:scale-[0.99]"
            >
              Claim Your Spot
              <span className="ml-4 text-xl leading-none">›</span>
            </a>
            <p className="text-sm font-semibold text-gray-300">The World Cup is coming. The receipts will last.</p>
          </div>
        </div>

        <div className="mx-auto h-[42.5rem] w-full max-w-[22rem] overflow-hidden pb-0 sm:h-[42rem] sm:max-w-[20rem] lg:hidden">
          <div className="origin-top scale-[0.98] sm:scale-[0.88]">
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
