import Link from "next/link";

import { SmackTalkLogo } from "@/components/SmackTalkLogo";

export function Footer() {
  return (
    <footer className="border-t border-white/10 py-8">
      <div className="landing-shell flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <SmackTalkLogo size={42} />
          <div>
            <p className="brand-lockup text-2xl leading-none">
              <span>Smack</span>{" "}
              <span className="bg-gradient-to-r from-lime-300 via-white to-purple-400 bg-clip-text text-transparent">
                Talk
              </span>
            </p>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-gray-500">
              LOCKT is a sports reputation platform. No betting. No odds. Just takes, receipts, and REP.
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
    </footer>
  );
}
