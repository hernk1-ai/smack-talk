import { socialLinks, type SocialPlatform } from "@/config/socialLinks";

type SocialLinksProps = {
  className?: string;
  compact?: boolean;
  heading?: string;
  subtext?: string;
};

type SocialLinkDef = {
  platform: SocialPlatform;
  label: string;
  href: string;
};

const linkDefs: SocialLinkDef[] = [
  { platform: "x", label: "X", href: socialLinks.x },
  { platform: "instagram", label: "Instagram", href: socialLinks.instagram },
  { platform: "tiktok", label: "TikTok", href: socialLinks.tiktok },
  { platform: "discord", label: "Discord", href: socialLinks.discord },
];

export function SocialLinks({
  className,
  compact = false,
  heading = "Follow Lockt",
  subtext = "World Cup calls, group breakdowns, receipt drops, and tournament storylines.",
}: SocialLinksProps) {
  return (
    <section className={className ?? ""}>
      <div className="rounded-[1.75rem] border border-white/10 bg-black/35 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.34)]">
        <h2 className="sports-display text-2xl italic leading-none text-white sm:text-3xl">{heading}</h2>
        <p className="mt-2 text-sm font-semibold text-gray-300">{subtext}</p>
        <div className={`mt-4 grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
          {linkDefs.map((link) => (
            <a
              key={link.platform}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Follow Lockt on ${link.label}`}
              className="group inline-flex min-h-11 items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs font-black uppercase tracking-[0.1em] text-white transition hover:border-lime-300/45 hover:text-lime-200"
            >
              <span>{link.label}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
