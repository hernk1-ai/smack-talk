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

function ScheduleIcon() {
  return (
    <svg aria-hidden="true" className="h-11 w-11" viewBox="0 0 24 24" fill="none">
      <path d="M7 4v2M17 4v2M5 8h14M6 6h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9 12h2v4H9v-4Zm4 0h2v4h-2v-4Z" fill="currentColor" />
    </svg>
  );
}

function GameRoomIcon() {
  return (
    <svg aria-hidden="true" className="h-11 w-11" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16v10H4V7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 11h3M13 11h3M8 14h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function FansIcon() {
  return (
    <svg aria-hidden="true" className="h-11 w-11" viewBox="0 0 24 24" fill="none">
      <path d="M8 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.5 19c.7-2.8 2.3-4.2 4.5-4.2s3.8 1.4 4.5 4.2M11.5 19c.7-2.8 2.3-4.2 4.5-4.2s3.8 1.4 4.5 4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

const features: Feature[] = [
  {
    icon: <ShieldIcon />,
    title: "Follow the Match",
    text: "Use the Match Hub and Schedule to find the game you care about.",
    tone: "lime",
  },
  {
    icon: <ScheduleIcon />,
    title: "Make a Call",
    text: "Pick a winner or exact score before kickoff. Your call is saved for that match.",
    tone: "purple",
  },
  {
    icon: <GameRoomIcon />,
    title: "Join the Game Room",
    text: "Watch with friends and family, react live, and ride or fade calls together.",
    tone: "lime",
  },
  {
    icon: <FansIcon />,
    title: "Keep It With Your People",
    text: "Share a match room link and keep the conversation in one place for that game.",
    tone: "purple",
  },
];

export function FeatureCards() {
  return (
    <section id="features" className="scroll-mt-24 border-b border-white/10 py-14 sm:py-24">
      <div className="landing-shell">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-300">World Cup Ready</p>
          <h2 className="sports-display mt-3 text-4xl italic leading-none text-white sm:text-6xl">The match is the product</h2>
        </div>

        <div className="mt-10 grid gap-0 overflow-hidden rounded-[2rem] border border-white/10 bg-black/25 sm:grid-cols-2 lg:grid-cols-4">
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
