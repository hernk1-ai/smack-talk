const features = [
  {
    icon: "⚡",
    title: "Lock Your Take",
    text: "Put your name behind your take. No edits. No switching sides.",
    tone: "lime",
  },
  {
    icon: "👥",
    title: "The Crowd Decides",
    text: "The internet rides with you or fades you. Every vote counts.",
    tone: "purple",
  },
  {
    icon: "🏆",
    title: "Build Your Rep",
    text: "Win arguments. Earn respect. Climb the ranks.",
    tone: "lime",
  },
  {
    icon: "🧾",
    title: "Get Your Receipts",
    text: "Receipts don’t lie. The internet never forgets.",
    tone: "purple",
  },
];

export function FeatureCards() {
  return (
    <section id="features" className="scroll-mt-24 border-b border-white/10 py-14 sm:py-24">
      <div className="landing-shell">
        <div className="mx-auto max-w-3xl text-center">
          <p className="sports-display text-3xl italic leading-none text-gray-300 sm:text-4xl">This isn’t just talk.</p>
          <h2 className="sports-display mt-2 bg-gradient-to-r from-lime-300 via-lime-200 to-purple-400 bg-clip-text text-4xl italic leading-none text-transparent sm:text-6xl">
            It’s a battle for respect.
          </h2>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              className={`landing-card group rounded-[1.75rem] border p-6 text-center transition duration-200 hover:-translate-y-1 ${
                feature.tone === "lime"
                  ? "border-lime-300/35 hover:border-lime-300/70 hover:shadow-[0_0_42px_rgba(132,204,22,0.13)]"
                  : "border-purple-400/35 hover:border-purple-300/70 hover:shadow-[0_0_42px_rgba(168,85,247,0.13)]"
              }`}
            >
              <div
                className={`mx-auto grid h-16 w-16 place-items-center rounded-full border text-3xl transition group-hover:scale-105 ${
                  feature.tone === "lime"
                    ? "border-lime-300/50 bg-lime-300/10 text-lime-300"
                    : "border-purple-300/50 bg-purple-500/10 text-purple-200"
                }`}
              >
                {feature.icon}
              </div>
              <h3
                className={`mt-6 text-xl font-black uppercase tracking-[0.08em] ${
                  feature.tone === "lime" ? "text-lime-300" : "text-purple-300"
                }`}
              >
                {feature.title}
              </h3>
              <p className="mt-4 text-sm font-semibold leading-6 text-gray-300">{feature.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
