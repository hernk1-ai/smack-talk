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
              <span className="bg-gradient-to-r from-purple-300 to-sky-300 bg-clip-text text-transparent">Talk</span>
            </p>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-gray-500">
              Built on takes. Backed by receipts.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-xs font-black uppercase tracking-[0.14em] text-gray-500">
          <a href="#" className="transition hover:text-white">
            Privacy Policy
          </a>
          <a href="#" className="transition hover:text-white">
            Terms of Service
          </a>
          <span>© 2026 Smack Talk</span>
        </div>
      </div>
    </footer>
  );
}
