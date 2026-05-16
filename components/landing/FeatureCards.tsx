type Feature = {
  title: string;
  text: string;
  tone: "lime" | "purple";
  icon: React.ReactNode;
};

function ShieldIcon() {
  return (
    <svg aria-hidden="true" className="h-11 w-11" viewBox="0 0 24 24" fill="none">
      <path d="M12 3 19 6v5.4c0 4.2-2.8 7.2-7 9.6-4.2-2.4-7-5.4-7-9.6V6l7-3Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="m13 7-4 6h3l-1 4 4-6h-3l1-4Z" fill="currentColor" />
    </svg>
  );
}

function RankIcon() {
  return (
    <svg aria-hidden="true" className="h-11 w-11" viewBox="0 0 24 24" fill="none">
      <path d="M5 19V9m7 10V5m7 14v-7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M3.5 19.5h17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function RivalIcon() {
  return (
    <svg aria-hidden="true" className="h-11 w-11" viewBox="0 0 24 24" fill="none">
      <path d="M8 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.5 19c.7-2.8 2.3-4.2 4.5-4.2s3.8 1.4 4.5 4.2M11.5 19c.7-2.8 2.3-4.2 4.5-4.2s3.8 1.4 4.5 4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg aria-hidden="true" className="h-11 w-11" viewBox="0 0 24 24" fill="none">
      <path d="M7 3h10v18l-2-1.3-2 1.3-2-1.3L9 21l-2-1.3V3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9.5 8h5M9.5 12h5M9.5 16h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg aria-hidden="true" className="h-11 w-11" viewBox="0 0 24 24" fill="none">
      <path d="M8 4h8v3.8c0 3.4-1.7 5.7-4 6.7-2.3-1-4-3.3-4-6.7V4Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 6H4.5c0 3.3 1.1 5 4.1 5.5M16 6h3.5c0 3.3-1.1 5-4.1 5.5M12 15v3M8.5 21h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m12 7.2.7 1.4 1.5.2-1.1 1.1.3 1.5-1.4-.7-1.4.7.3-1.5-1.1-1.1 1.5-.2.7-1.4Z" fill="currentColor" />
    </svg>
  );
}

const features: Feature[] = [
  {
    icon: <ShieldIcon />,
    title: "Lock It.",
    text: "Make your take public before the game, the run, or the meltdown. Once it’s locked, it lives.",
    tone: "lime",
  },
  {
    icon: <RankIcon />,
    title: "Ride or Fade",
    text: "Back a take, fade the Crowd, or call out your opps when the game flips.",
    tone: "purple",
  },
  {
    icon: <RivalIcon />,
    title: "Build REP",
    text: "Every lock, ride, fade, and receipt shapes your reputation.",
    tone: "lime",
  },
  {
    icon: <ReceiptIcon />,
    title: "Show Receipts",
    text: "Receipts track who talked, who stood on it, and who got cooked.",
    tone: "purple",
  },
  {
    icon: <TrophyIcon />,
    title: "Top Talkers",
    text: "Climb the board and prove your Smack IQ when the Crowd is loud.",
    tone: "lime",
  },
];

export function FeatureCards() {
  return (
    <section id="features" className="scroll-mt-24 border-b border-white/10 py-14 sm:py-24">
      <div className="landing-shell">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300">This isn’t just talk.</p>
          <h2 className="sports-display mt-3 text-4xl italic leading-none text-white sm:text-6xl">This is LOCKT.</h2>
        </div>

        <div className="mt-10 grid gap-0 overflow-hidden rounded-[2rem] border border-white/10 bg-black/25 sm:grid-cols-2 lg:grid-cols-5">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group border-b border-white/10 p-6 text-center transition duration-200 hover:bg-white/[0.035] sm:border-r sm:last:border-r-0 lg:border-b-0"
            >
              <div
                className={`mx-auto grid h-16 w-16 place-items-center rounded-full transition group-hover:scale-105 ${
                  feature.tone === "lime" ? "text-lime-300" : "text-purple-300"
                }`}
              >
                {feature.icon}
              </div>
              <h3 className="mt-6 text-base font-black uppercase tracking-[0.08em] text-white">{feature.title}</h3>
              <p className="mt-4 text-sm font-semibold leading-6 text-gray-400">{feature.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
