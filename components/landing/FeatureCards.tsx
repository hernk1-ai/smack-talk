const features = [
  {
    title: "Lock Your Take",
    text: "Put your name behind your take. No edits. No switching sides.",
  },
  {
    title: "The Crowd Decides",
    text: "The internet rides with you or fades you. Every vote counts.",
  },
  {
    title: "Build Your Rep",
    text: "Win arguments. Earn respect. Climb the ranks.",
  },
  {
    title: "Get Your Receipts",
    text: "Receipts don’t lie. The internet never forgets.",
  },
];

export function FeatureCards() {
  return (
    <section id="features" className="scroll-mt-24 border-b border-white/10 py-16 sm:py-24">
      <div className="landing-shell">
        <div className="max-w-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-green-200">Features</p>
          <h2 className="sports-display mt-3 text-5xl leading-none sm:text-7xl">Lock Takes. Build Status.</h2>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <article key={feature.title} className="landing-card rounded-[1.75rem] border border-white/10 p-6">
              <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-green-300 to-purple-400" />
              <h3 className="mt-6 text-2xl font-black uppercase tracking-[0.08em]">{feature.title}</h3>
              <p className="mt-4 text-base font-semibold leading-7 text-gray-400">{feature.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
