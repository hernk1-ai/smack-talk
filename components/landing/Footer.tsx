import Link from "next/link";

import { LocktLogo } from "@/components/LocktLogo";
import { SocialLinks } from "@/components/SocialLinks";

export function Footer() {
  return (
    <footer className="border-t border-white/10 py-8">
      <div className="landing-shell space-y-5">
        <SocialLinks compact heading="Follow Lockt" subtext="World Cup calls, group breakdowns, receipt drops, and tournament storylines." />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <LocktLogo size={42} />
            <div>
              <p className="brand-lockup text-2xl leading-none">
                <span className="bg-gradient-to-r from-lime-300 via-white to-purple-400 bg-clip-text text-transparent">LOCKT</span>
              </p>
              <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-gray-500">
                13+ · No betting · No odds · No cash prizes. Rep has no cash value.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs font-black uppercase tracking-[0.14em] text-gray-500">
            <Link href="/privacy" className="transition hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition hover:text-white">
              Terms of Use
            </Link>
            <span>© 2026 LOCKT</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
