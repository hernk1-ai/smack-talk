type SocialLink = {
  label: string;
  href: string;
  hoverClass: string;
  icon: React.ReactNode;
  isExternal?: boolean;
};

function XIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.7 3h3.1l-6.9 7.9L22 21h-6.4l-5-6.2L4.9 21H1.8l7.3-8.4L1.3 3h6.5l4.5 5.7L17.7 3Zm-1.1 16.2h1.7L6.9 4.7H5.1l11.5 14.5Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <rect width="17" height="17" x="3.5" y="3.5" rx="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="3.7" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.7 3c.3 2.4 1.7 3.9 4 4.1v3.3a7.5 7.5 0 0 1-4-1.2v5.9c0 3.6-2.3 5.9-5.8 5.9a5.5 5.5 0 0 1-5.7-5.4c0-3.4 2.7-5.8 6.3-5.4v3.4c-1.7-.3-3 .5-3 2a2.2 2.2 0 0 0 2.3 2.1c1.5 0 2.5-.8 2.5-2.8V3h3.4Z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.8 5.3A15 15 0 0 0 15.2 4l-.4.8a13.7 13.7 0 0 1 3.2 1.6 10.6 10.6 0 0 0-9.9 0 13 13 0 0 1 3.1-1.6L10.8 4a15 15 0 0 0-3.6 1.3C4.9 8.6 4.3 11.8 4.6 15a14.5 14.5 0 0 0 4.4 2.2l.9-1.4a9.3 9.3 0 0 1-1.4-.7l.3-.2a10.4 10.4 0 0 0 6.4 0l.3.2c-.4.3-.9.5-1.4.7l.9 1.4a14.5 14.5 0 0 0 4.4-2.2c.4-3.7-.6-6.8-2.6-9.7ZM9.8 13.1c-.8 0-1.4-.7-1.4-1.6s.6-1.6 1.4-1.6 1.4.7 1.4 1.6-.6 1.6-1.4 1.6Zm4.4 0c-.8 0-1.4-.7-1.4-1.6s.6-1.6 1.4-1.6 1.4.7 1.4 1.6-.6 1.6-1.4 1.6Z" />
    </svg>
  );
}

function ExternalCue() {
  return (
    <svg
      aria-hidden="true"
      className="h-3 w-3 opacity-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-70"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const socialLinks: SocialLink[] = [
  {
    label: "X",
    href: "https://x.com/smacktalkgg",
    hoverClass: "hover:border-white/35 hover:shadow-[0_0_24px_rgba(255,255,255,0.12)]",
    icon: <XIcon />,
    isExternal: true,
  },
  {
    label: "Instagram",
    href: "https://instagram.com/smacktalkgg",
    hoverClass: "hover:border-pink-300/45 hover:shadow-[0_0_24px_rgba(236,72,153,0.16)]",
    icon: <InstagramIcon />,
    isExternal: true,
  },
  {
    label: "TikTok",
    href: "https://tiktok.com/@smacktalkgg",
    hoverClass: "hover:border-cyan-300/45 hover:shadow-[0_0_24px_rgba(34,211,238,0.16)]",
    icon: <TikTokIcon />,
    isExternal: true,
  },
  {
    label: "Discord",
    href: "#",
    hoverClass: "hover:border-indigo-300/45 hover:shadow-[0_0_24px_rgba(129,140,248,0.16)]",
    icon: <DiscordIcon />,
  },
];

export function SocialLinks() {
  return (
    <section className="py-10">
      <div className="landing-shell">
        <div className="grid gap-4 rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <p className="text-sm font-black uppercase italic tracking-[0.18em] text-purple-300">Follow Smack Talk</p>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.isExternal ? "_blank" : undefined}
                rel={link.isExternal ? "noopener noreferrer" : undefined}
                className={`group inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-black/35 px-4 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-gray-300 transition duration-200 hover:-translate-y-0.5 hover:text-white active:translate-y-0 active:scale-[0.98] ${link.hoverClass}`}
                aria-label={`Follow Smack Talk on ${link.label}`}
              >
                <span className="transition group-hover:scale-110">{link.icon}</span>
                <span>{link.label}</span>
                {link.isExternal && <ExternalCue />}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
