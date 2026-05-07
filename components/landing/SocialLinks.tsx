const socialLinks = ["X / Twitter", "Instagram", "TikTok", "Discord"];

export function SocialLinks() {
  return (
    <section className="py-10">
      <div className="landing-shell">
        <div className="grid gap-4 rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <p className="text-sm font-black uppercase italic tracking-[0.18em] text-purple-300">Follow the movement</p>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            {socialLinks.map((label) => (
              <a
                key={label}
                href="#"
                className="min-h-11 rounded-full border border-white/10 bg-black/35 px-4 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-gray-300 transition hover:border-lime-300/50 hover:text-white"
              >
                {label.replace("X / ", "")}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
