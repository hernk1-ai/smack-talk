import { PhonePreview } from "@/components/landing/PhonePreview";
import { WaitlistForm } from "@/components/landing/WaitlistForm";

export function HeroSection() {
  return (
    <section id="about" className="relative overflow-hidden border-b border-white/10">
      <div className="landing-shell grid min-h-[calc(100dvh-4.5rem)] items-center gap-9 py-8 sm:py-14 md:grid-cols-[minmax(0,1fr)_21rem] md:gap-10 lg:grid-cols-[minmax(0,1fr)_25rem] xl:grid-cols-[minmax(0,1fr)_27rem]">
        <div className="hero-copy relative max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-lg border border-lime-300/35 bg-black/55 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-lime-200 shadow-[0_0_22px_rgba(132,204,22,0.13)]">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-300 shadow-[0_0_14px_rgba(132,204,22,0.95)]" />
            Arena Loading
          </div>

          <h1 className="hero-title sports-display mt-4 text-[clamp(2.42rem,11.6vw,5.95rem)] leading-[0.82] tracking-[0.01em] text-white sm:text-[6.35rem] md:text-[6.2rem] lg:text-[7.2rem] xl:text-[7.95rem]">
            <span className="block whitespace-nowrap">Talk Smack.</span>
            <span className="hero-receipts block whitespace-nowrap bg-gradient-to-r from-lime-300 via-white to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(132,204,22,0.18)]">
              Show Receipts.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-center text-xl font-black uppercase leading-tight tracking-[0.16em] text-gray-200 sm:text-2xl md:mt-8 md:text-left">
            Lock your takes.
            <span className="block">
              Build <span className="text-lime-300">your reputation.</span>
            </span>
          </p>
          <p className="mt-5 max-w-xl text-center text-base font-semibold leading-7 text-gray-400 sm:text-lg md:text-left">
            Smack Talk turns live sports arguments into public calls, crowd pressure, and receipts that follow the
            scoreboard.
          </p>

          <div className="mt-6 grid max-w-xl grid-cols-2 gap-3 text-center sm:grid-cols-4 md:mt-7">
            {["Lock Your Take", "Ride or Fade", "Earn Reputation", "Get Receipts"].map((label) => (
              <div key={label} className="border-white/10 sm:border-l sm:first:border-l-0">
                <p className="text-2xl text-gray-200">{label === "Lock Your Take" ? "⚡" : label === "Ride or Fade" ? "👥" : label === "Earn Reputation" ? "🏆" : "🧾"}</p>
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">{label}</p>
              </div>
            ))}
          </div>

          <div id="waitlist" className="mt-7 max-w-lg scroll-mt-28 md:mt-8">
            <WaitlistForm />
          </div>
        </div>

        <div className="md:scale-[0.84] md:justify-self-end md:opacity-95 lg:scale-[0.9] xl:scale-[0.96]">
          <PhonePreview />
        </div>
      </div>
    </section>
  );
}
