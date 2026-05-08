import { PhonePreview } from "@/components/landing/PhonePreview";

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

        <div className="hidden justify-self-end lg:block lg:scale-[0.9] xl:scale-[0.96]">
          <PhonePreview />
        </div>
      </div>
    </section>
  );
}
