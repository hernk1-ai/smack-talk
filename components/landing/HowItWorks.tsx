const steps = [
  { icon: "⚡", title: "Lock Your Take", text: "Make the call before the moment flips." },
  { icon: "😈", title: "Ride or Fade", text: "Back the take or call it cooked." },
  { icon: "🏆", title: "Earn Reputation", text: "Correct calls move your name up." },
  { icon: "🧾", title: "Get Your Receipts", text: "The final score writes the story." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 border-b border-white/10 py-16 sm:py-24">
      <div className="landing-shell">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-purple-300">How It Works</p>
        <h2 className="sports-display mt-3 text-5xl leading-none sm:text-7xl">Sports Talk. Prove It.</h2>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <article key={step.title} className="premium-card rounded-[1.5rem] border p-5">
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-2xl">
                  {step.icon}
                </span>
                <span className="scoreboard-number text-3xl text-gray-700">0{index + 1}</span>
              </div>
              <h3 className="mt-5 text-lg font-black uppercase tracking-[0.08em]">{step.title}</h3>
              <p className="mt-3 text-sm font-semibold leading-6 text-gray-400">{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
