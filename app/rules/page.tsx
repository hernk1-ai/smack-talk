export default function RulesPage() {
  return (
    <main className="min-h-dvh bg-[#070a12] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-2xl border border-yellow-300/30 bg-yellow-500/10 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-yellow-300">Referee Briefing</p>
          <h1 className="mt-2 text-4xl font-black italic leading-none">Arena Rules</h1>
          <p className="mt-3 text-sm font-semibold text-gray-200">Attack takes. Not lives.</p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
          <h2 className="text-xl font-black uppercase tracking-[0.08em] text-lime-300">Smack Talk Is Built For</h2>
          <ul className="mt-3 space-y-2 text-sm font-semibold text-gray-200">
            <li>• Rivalries</li>
            <li>• Hot takes</li>
            <li>• Emotional sports debates</li>
            <li>• Public accountability</li>
          </ul>
          <p className="mt-4 text-base font-black italic text-white">Talk your shit.</p>
        </section>

        <section className="rounded-2xl border border-red-300/30 bg-red-500/10 p-5">
          <h2 className="text-xl font-black uppercase tracking-[0.08em] text-red-200">Automatic Fouls</h2>
          <ul className="mt-3 space-y-2 text-sm font-semibold text-gray-100">
            <li>• No hate speech</li>
            <li>• No threats</li>
            <li>• No doxxing</li>
            <li>• No harassment campaigns</li>
            <li>• No spam flooding</li>
          </ul>
          <p className="mt-4 text-xs font-black uppercase tracking-[0.1em] text-red-200">Flagged content may be put under review or removed.</p>
        </section>
      </div>
    </main>
  );
}
