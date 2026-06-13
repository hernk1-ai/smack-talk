import { socialLinks, type SocialPlatform } from "@/config/socialLinks";

type SocialLinksProps = {
  className?: string;
  compact?: boolean;
  embedded?: boolean;
  heading?: string;
  subtext?: string;
  withPlatformTaglines?: boolean;
};

type SocialLinkDef = {
  platform: SocialPlatform;
  label: string;
  href: string;
  tagline: string;
};

const linkDefs: SocialLinkDef[] = [
  { platform: "x", label: "X", href: socialLinks.x, tagline: "Live match reactions" },
  { platform: "instagram", label: "Instagram", href: socialLinks.instagram, tagline: "Highlights & updates" },
  { platform: "discord", label: "Discord", href: socialLinks.discord, tagline: "Watch with the community" },
];

export function SocialLinks({
  className,
  compact = false,
  embedded = false,
  heading = "Follow Lockt",
  subtext = "World Cup calls, group breakdowns, receipt drops, and tournament storylines.",
  withPlatformTaglines = false,
}: SocialLinksProps) {
  const gridClass = "grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3";

  const links = (
    <div className={`${gridClass} ${embedded ? "" : "mt-4"}`}>
      {linkDefs.map((link) => (
        <a
          key={link.platform}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Follow Lockt on ${link.label}`}
          className={`group rounded-xl border border-white/10 bg-[var(--surface-card)] px-3 py-2 text-white transition hover:border-lime-300/45 hover:text-lime-200 ${
            withPlatformTaglines
              ? "flex min-h-[4.5rem] flex-col items-start justify-center gap-1 py-3"
              : "inline-flex min-h-11 items-center justify-between gap-2 text-xs font-black uppercase tracking-[0.1em]"
          }`}
        >
          <span className={withPlatformTaglines ? "text-xs font-black uppercase tracking-[0.1em]" : ""}>
            {link.label}
          </span>
          {withPlatformTaglines ? (
            <span className="text-[11px] font-semibold normal-case tracking-normal text-gray-400 transition group-hover:text-lime-200/85">
              {link.tagline}
            </span>
          ) : null}
        </a>
      ))}
    </div>
  );

  if (embedded) {
    return (
      <div className={className ?? ""}>
        <p className="text-sm font-semibold text-gray-300">{subtext}</p>
        <div className="mt-3">{links}</div>
      </div>
    );
  }

  return (
    <section className={className ?? ""}>
      <div className="rounded-[1.75rem] border border-white/10 bg-[var(--surface-section)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.34)]">
        <h2 className="sports-display text-2xl italic leading-none text-white sm:text-3xl">{heading}</h2>
        <p className="mt-2 text-sm font-semibold text-gray-300">{subtext}</p>
        {links}
      </div>
    </section>
  );
}
