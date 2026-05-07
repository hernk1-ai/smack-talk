import { PhonePreview } from "@/components/landing/PhonePreview";
import { WaitlistForm } from "@/components/landing/WaitlistForm";

export function HeroSection() {
  return (
    <section id="about" className="relative overflow-hidden border-b border-white/10">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.28),transparent_68%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#02040a] to-transparent" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="absolute left-[-8rem] top-[18rem] h-px w-[34rem] rotate-[-8deg] bg-gradient-to-r from-transparent via-lime-300/70 to-transparent blur-[1px]" />
        <div className="absolute right-[-6rem] top-28 h-px w-[30rem] rotate-[18deg] bg-gradient-to-r from-transparent via-purple-400/70 to-transparent blur-[1px]" />
      </div>

      <div className="landing-shell grid min-h-[calc(100dvh-4.5rem)] items-center gap-10 py-10 sm:py-14 md:grid-cols-[minmax(0,1fr)_25rem] md:gap-14 lg:grid-cols-[minmax(0,1fr)_30rem]">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/25 bg-lime-300/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-lime-200">
            <span className="h-2 w-2 rounded-full bg-green-300 shadow-[0_0_16px_rgba(45,212,191,0.9)]" />
            Coming Soon
          </div>

          <h1 className="hero-title sports-display mt-5 text-[clamp(4rem,20vw,6.9rem)] leading-[0.82] tracking-[0.01em] text-white sm:text-[8.4rem] lg:text-[9.8rem]">
            Talk Smack.
            <span className="block bg-gradient-to-r from-lime-300 via-white to-purple-500 bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(132,204,22,0.18)]">
              Show Receipts.
            </span>
          </h1>

          <div className="mt-4 h-2 w-full max-w-xl bg-gradient-to-r from-lime-400 via-lime-300 to-purple-500 shadow-[0_0_24px_rgba(132,204,22,0.32)] [clip-path:polygon(0_35%,100%_0,96%_70%,2%_100%)]" />

          <p className="mt-8 max-w-xl text-center text-xl font-black uppercase leading-tight tracking-[0.16em] text-gray-200 sm:text-2xl md:text-left">
            Lock your takes.
            <span className="block">
              Build <span className="text-lime-300">your reputation.</span>
            </span>
          </p>
          <p className="mt-5 max-w-xl text-center text-base font-semibold leading-7 text-gray-400 sm:text-lg md:text-left">
            Smack Talk turns live sports arguments into public calls, crowd pressure, and receipts that follow the
            scoreboard.
          </p>

          <div className="mt-7 grid max-w-xl grid-cols-2 gap-3 text-center sm:grid-cols-4">
            {["Lock Your Take", "Ride or Fade", "Earn Reputation", "Get Receipts"].map((label) => (
              <div key={label} className="border-white/10 sm:border-l sm:first:border-l-0">
                <p className="text-2xl text-gray-200">{label === "Lock Your Take" ? "⚡" : label === "Ride or Fade" ? "👥" : label === "Earn Reputation" ? "🏆" : "🧾"}</p>
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">{label}</p>
              </div>
            ))}
          </div>

          <div id="waitlist" className="mt-8 max-w-lg scroll-mt-28">
            <WaitlistForm />
          </div>
        </div>

        <PhonePreview />
      </div>
    </section>
  );
}
