import { PhonePreview } from "@/components/landing/PhonePreview";
import { WaitlistForm } from "@/components/landing/WaitlistForm";

export function HeroSection() {
  return (
    <section id="about" className="relative overflow-hidden border-b border-white/10">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.22),transparent_68%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#02040a] to-transparent" />
        <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:42px_42px]" />
      </div>

      <div className="landing-shell grid min-h-[calc(100dvh-5rem)] items-center gap-10 py-12 md:grid-cols-[minmax(0,1fr)_25rem] md:gap-14 lg:grid-cols-[minmax(0,1fr)_29rem]">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-green-300/20 bg-green-300/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-green-200">
            <span className="h-2 w-2 rounded-full bg-green-300 shadow-[0_0_16px_rgba(45,212,191,0.9)]" />
            Coming Soon
          </div>

          <h1 className="sports-display mt-6 text-[4.2rem] leading-[0.82] tracking-[0.01em] text-white sm:text-8xl lg:text-[8.8rem]">
            Talk Smack.
            <span className="block bg-gradient-to-r from-teal-200 via-white to-purple-300 bg-clip-text text-transparent">
              Show Receipts.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-xl font-black uppercase leading-tight tracking-[0.12em] text-gray-300 sm:text-2xl">
            Lock your takes. Build your reputation.
          </p>
          <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-gray-400 sm:text-lg">
            Smack Talk turns live sports arguments into public calls, crowd pressure, and receipts that follow the
            scoreboard.
          </p>

          <div id="waitlist" className="mt-8 max-w-lg scroll-mt-28">
            <WaitlistForm />
          </div>
        </div>

        <PhonePreview />
      </div>
    </section>
  );
}
