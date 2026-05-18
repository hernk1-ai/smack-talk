import Link from "next/link";
import { SocialLinks as GlobalSocialLinks } from "@/components/SocialLinks";

export function SocialLinks() {
  return (
    <section className="py-10">
      <div className="landing-shell space-y-4">
        <GlobalSocialLinks
          heading="Follow the World Cup call board"
          subtext="Lockt is tracking tournament storylines, bold calls, and receipts all World Cup long."
        />
        <div className="flex justify-center">
          <Link
            href="/signup"
            className="inline-flex min-h-11 items-center rounded-xl border border-lime-300/55 bg-lime-400/10 px-4 text-xs font-black uppercase tracking-[0.12em] text-lime-200 transition hover:border-lime-300 hover:text-lime-100"
          >
            Make First Call
          </Link>
        </div>
      </div>
    </section>
  );
}
